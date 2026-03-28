from __future__ import annotations

import argparse
import io
from dataclasses import dataclass
from pathlib import Path

import fitz
from PIL import Image

# Cambia esta ruta por el PDF que quieras procesar cuando ejecutes el archivo desde VS Code.
DEFAULT_PDF_PATH = Path(r"C:\Users\Norte Publicitario 1\Desktop\MouseWithoutBorders\mi-catalogo.pdf")
DEFAULT_OUTPUT_DIR = Path("product-images")


@dataclass(frozen=True)
class CandidateImage:
    xref: int
    width: int
    height: int
    ext: str
    data: bytes

    @property
    def area(self) -> int:
        return self.width * self.height


@dataclass(frozen=True)
class ExtractionSummary:
    pages_processed: int
    images_saved: int
    pages_without_candidates: list[int]


def parse_hex_color(value: str) -> tuple[int, int, int]:
    normalized = value.strip().lstrip("#")
    if len(normalized) != 6:
        raise ValueError("Background color must be a 6-digit hex value like 'efefef'.")
    return tuple(int(normalized[index:index + 2], 16) for index in (0, 2, 4))


def render_on_canvas(
    image_data: bytes,
    canvas_size: int,
    background_color: tuple[int, int, int],
) -> Image.Image:
    with Image.open(io.BytesIO(image_data)) as source_image:
        image = source_image.convert("RGBA")
        scale = min(canvas_size / image.width, canvas_size / image.height)
        resized_size = (
            max(1, round(image.width * scale)),
            max(1, round(image.height * scale)),
        )
        resized = image.resize(resized_size, Image.Resampling.LANCZOS)

    background = Image.new("RGBA", (canvas_size, canvas_size), background_color + (255,))
    offset = (
        (canvas_size - resized.width) // 2,
        (canvas_size - resized.height) // 2,
    )
    background.paste(resized, offset, resized)
    return background.convert("RGB")


def collect_page_candidates(doc: fitz.Document, page_index: int, min_size: int) -> list[CandidateImage]:
    seen_xrefs: set[int] = set()
    candidates: list[CandidateImage] = []

    for image_ref in doc.get_page_images(page_index, full=True):
        xref = image_ref[0]
        if xref in seen_xrefs:
            continue
        seen_xrefs.add(xref)

        info = doc.extract_image(xref)
        width = info["width"]
        height = info["height"]

        if width < min_size or height < min_size:
            continue

        candidates.append(
            CandidateImage(
                xref=xref,
                width=width,
                height=height,
                ext=info["ext"],
                data=info["image"],
            )
        )

    return sorted(candidates, key=lambda candidate: candidate.area, reverse=True)


def extract_candidate_images(
    pdf_path: Path,
    output_dir: Path,
    start_page: int,
    end_page: int | None,
    min_size: int,
    max_per_page: int | None,
    canvas_size: int,
    background_color: tuple[int, int, int],
) -> ExtractionSummary:
    output_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    images_saved = 0
    pages_without_candidates: list[int] = []

    try:
        final_page = end_page if end_page is not None else len(doc)
        if start_page < 1 or final_page < start_page:
            raise ValueError("Page range is invalid.")

        for page_number in range(start_page, final_page + 1):
            page_index = page_number - 1
            candidates = collect_page_candidates(doc, page_index, min_size)

            if not candidates:
                pages_without_candidates.append(page_number)
                continue

            if max_per_page is not None:
                candidates = candidates[:max_per_page]

            for image_index, candidate in enumerate(candidates, start=1):
                filename = f"{page_number:03d}-img-{image_index:02d}.jpg"
                output_path = output_dir / filename
                composed = render_on_canvas(
                    image_data=candidate.data,
                    canvas_size=canvas_size,
                    background_color=background_color,
                )
                composed.save(output_path, format="JPEG", quality=95)
                images_saved += 1
    finally:
        doc.close()

    pages_processed = final_page - start_page + 1
    return ExtractionSummary(
        pages_processed=pages_processed,
        images_saved=images_saved,
        pages_without_candidates=pages_without_candidates,
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Extract all large embedded images from each PDF page."
    )
    parser.add_argument(
        "pdf",
        type=Path,
        nargs="?",
        default=DEFAULT_PDF_PATH,
        help="Path to the source PDF file.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="Directory where images will be written.",
    )
    parser.add_argument(
        "--start-page",
        type=int,
        default=1,
        help="First page to inspect.",
    )
    parser.add_argument(
        "--end-page",
        type=int,
        default=None,
        help="Last page to inspect. Defaults to the end of the document.",
    )
    parser.add_argument(
        "--min-size",
        type=int,
        default=500,
        help="Minimum width and height for candidate images.",
    )
    parser.add_argument(
        "--max-per-page",
        type=int,
        default=None,
        help="Maximum number of images to save per page. Defaults to no limit.",
    )
    parser.add_argument(
        "--canvas-size",
        type=int,
        default=800,
        help="Square output size in pixels for each exported image.",
    )
    parser.add_argument(
        "--background-color",
        type=str,
        default="efefef",
        help="Canvas background color as a 6-digit hex value.",
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()
    background_color = parse_hex_color(args.background_color)
    summary = extract_candidate_images(
        pdf_path=args.pdf,
        output_dir=args.output,
        start_page=args.start_page,
        end_page=args.end_page,
        min_size=args.min_size,
        max_per_page=args.max_per_page,
        canvas_size=args.canvas_size,
        background_color=background_color,
    )

    print(f"Pages processed: {summary.pages_processed}")
    print(f"Images saved: {summary.images_saved}")
    if summary.pages_without_candidates:
        joined_pages = ", ".join(str(page) for page in summary.pages_without_candidates)
        print(f"Pages without candidates: {joined_pages}")
    else:
        print("Pages without candidates: none")
    print(f"Canvas size: {args.canvas_size}x{args.canvas_size}")
    print(f"Background color: #{args.background_color.lower().lstrip('#')}")
    print(f"Output directory: {args.output.resolve()}")


if __name__ == "__main__":
    main()
