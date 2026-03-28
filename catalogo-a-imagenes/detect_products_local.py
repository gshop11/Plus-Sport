from __future__ import annotations

import argparse
import json
import os
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from PIL import Image


@dataclass(frozen=True)
class DetectionResult:
    page: int
    detection_index: int
    class_name: str
    confidence: float
    bbox: list[int]
    crop_path: str


def load_yolo_model(model_path: str):
    settings_dir = Path(__file__).resolve().parent / ".ultralytics"
    settings_dir.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("YOLO_CONFIG_DIR", str(settings_dir))

    try:
        from ultralytics import YOLO
    except ImportError as exc:  # pragma: no cover - runtime environment dependent
        raise RuntimeError(
            "Ultralytics is not installed. Install it with "
            "'python -m pip install ultralytics' to enable local detection."
        ) from exc

    return YOLO(model_path)


def is_valid_detection(
    class_name: str,
    confidence: float,
    width: int,
    height: int,
    confidence_threshold: float,
    class_filter: str | None,
    min_crop_size: int,
) -> bool:
    if confidence < confidence_threshold:
        return False
    if class_filter and class_name.lower() != class_filter.lower():
        return False
    if width < min_crop_size or height < min_crop_size:
        return False
    return True


def extract_page_number(image_path: Path) -> int:
    digits = "".join(character for character in image_path.stem if character.isdigit())
    return int(digits) if digits else 0


def detect_products(
    input_dir: Path,
    output_dir: Path,
    model_path: str,
    confidence_threshold: float,
    class_filter: str | None,
    min_crop_size: int,
    nms_threshold: float,
) -> list[DetectionResult]:
    output_dir.mkdir(parents=True, exist_ok=True)
    model = load_yolo_model(model_path)
    results: list[DetectionResult] = []

    image_paths = sorted(
        path for path in input_dir.iterdir() if path.suffix.lower() in {".png", ".jpg", ".jpeg"}
    )

    for image_path in image_paths:
        inference = model.predict(
            source=str(image_path),
            conf=confidence_threshold,
            iou=nms_threshold,
            verbose=False,
        )
        page_number = extract_page_number(image_path)

        with Image.open(image_path) as image:
            detection_index = 0
            for prediction in inference:
                names: dict[int, str] = prediction.names
                boxes = prediction.boxes
                if boxes is None:
                    continue

                for box in boxes:
                    class_id = int(box.cls[0].item())
                    class_name = names.get(class_id, str(class_id))
                    confidence = float(box.conf[0].item())
                    x1, y1, x2, y2 = [int(value) for value in box.xyxy[0].tolist()]
                    width = x2 - x1
                    height = y2 - y1

                    if not is_valid_detection(
                        class_name=class_name,
                        confidence=confidence,
                        width=width,
                        height=height,
                        confidence_threshold=confidence_threshold,
                        class_filter=class_filter,
                        min_crop_size=min_crop_size,
                    ):
                        continue

                    detection_index += 1
                    crop_path = output_dir / f"page-{page_number:03d}-det-{detection_index:02d}.jpg"
                    cropped = image.crop((x1, y1, x2, y2))
                    cropped.save(crop_path, quality=95)

                    results.append(
                        DetectionResult(
                            page=page_number,
                            detection_index=detection_index,
                            class_name=class_name,
                            confidence=round(confidence, 4),
                            bbox=[x1, y1, x2, y2],
                            crop_path=str(crop_path.resolve()),
                        )
                    )

    return results


def save_results(output_dir: Path, detections: list[DetectionResult], config: dict[str, Any]) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    results_path = output_dir / "results.json"
    payload = {
        "config": config,
        "detections": [asdict(detection) for detection in detections],
    }
    results_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return results_path


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Detect products from rendered PDF pages using a local YOLO model."
    )
    parser.add_argument(
        "input_dir",
        type=Path,
        help="Directory containing rendered page images.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("detected-products"),
        help="Directory where cropped detections and results.json will be written.",
    )
    parser.add_argument(
        "--model",
        type=str,
        default="yolov8n.pt",
        help="Path or model name to load with Ultralytics YOLO.",
    )
    parser.add_argument(
        "--confidence",
        type=float,
        default=0.25,
        help="Minimum confidence threshold.",
    )
    parser.add_argument(
        "--class-filter",
        type=str,
        default=None,
        help="Optional class name to keep, for example 'shoe'.",
    )
    parser.add_argument(
        "--min-crop-size",
        type=int,
        default=96,
        help="Minimum width and height for saved crops.",
    )
    parser.add_argument(
        "--nms-threshold",
        type=float,
        default=0.45,
        help="Intersection-over-union threshold used by the detector.",
    )
    args = parser.parse_args()

    detections = detect_products(
        input_dir=args.input_dir,
        output_dir=args.output,
        model_path=args.model,
        confidence_threshold=args.confidence,
        class_filter=args.class_filter,
        min_crop_size=args.min_crop_size,
        nms_threshold=args.nms_threshold,
    )
    results_path = save_results(
        output_dir=args.output,
        detections=detections,
        config={
            "input_dir": str(args.input_dir.resolve()),
            "model": args.model,
            "confidence": args.confidence,
            "class_filter": args.class_filter,
            "min_crop_size": args.min_crop_size,
            "nms_threshold": args.nms_threshold,
        },
    )

    print(f"Detections saved: {len(detections)}")
    print(f"Results file: {results_path.resolve()}")


if __name__ == "__main__":
    main()
