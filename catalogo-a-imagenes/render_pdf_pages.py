from __future__ import annotations

import argparse
from pathlib import Path

import fitz


def render_pdf_pages(
    pdf_path: Path,
    output_dir: Path,
    fmt: str,
    dpi: int,
    start_page: int,
    end_page: int | None,
) -> int:
    output_dir.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(pdf_path)
    matrix = fitz.Matrix(dpi / 72, dpi / 72)

    try:
        final_page = end_page if end_page is not None else len(doc)
        if start_page < 1 or final_page < start_page:
            raise ValueError("Page range is invalid.")

        rendered = 0
        for page_number in range(start_page, final_page + 1):
            page = doc[page_number - 1]
            pix = page.get_pixmap(matrix=matrix, alpha=False)
            output_path = output_dir / f"page-{page_number:03d}.{fmt}"
            pix.save(output_path)
            rendered += 1
    finally:
        doc.close()

    return rendered


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Render each PDF page into a PNG or JPG image."
    )
    parser.add_argument("pdf", type=Path, help="Path to the source PDF file.")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("rendered-pages"),
        help="Directory where rendered pages will be written.",
    )
    parser.add_argument(
        "--format",
        choices=("png", "jpg"),
        default="png",
        help="Image format for rendered pages.",
    )
    parser.add_argument(
        "--dpi",
        type=int,
        default=200,
        help="Rasterization quality in dots per inch.",
    )
    parser.add_argument(
        "--start-page",
        type=int,
        default=1,
        help="First page to render.",
    )
    parser.add_argument(
        "--end-page",
        type=int,
        default=None,
        help="Last page to render. Defaults to the end of the document.",
    )
    args = parser.parse_args()

    rendered = render_pdf_pages(
        pdf_path=args.pdf,
        output_dir=args.output,
        fmt=args.format,
        dpi=args.dpi,
        start_page=args.start_page,
        end_page=args.end_page,
    )
    print(f"Rendered {rendered} pages into '{args.output.resolve()}'.")


if __name__ == "__main__":
    main()
