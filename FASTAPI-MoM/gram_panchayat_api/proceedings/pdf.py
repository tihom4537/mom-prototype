"""
Render the proceedings notesheet (statutory sheets + category sheets) to PDF.

HTML comes from Jinja templates in this package; the PDF is produced by
WeasyPrint with the bundled Noto fonts, so output is identical on every host.
Rendering is CPU-bound and takes ~100 MB briefly, so it runs in a worker
thread and only one render happens at a time per process.
"""
import asyncio
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

from jinja2 import Environment, FileSystemLoader, select_autoescape

from .catalogue import CELL_TEXT, STATUTORY_COUNT, sheet_for

logger = logging.getLogger(__name__)

_HERE = Path(__file__).resolve().parent
_ENV = Environment(
    loader=FileSystemLoader(str(_HERE)),
    autoescape=select_autoescape(["html"]),
    trim_blocks=True,
    lstrip_blocks=True,
)
_ENV.globals["cell_text"] = CELL_TEXT

_RENDER_LOCK = asyncio.Semaphore(1)
_ROWS_PER_CATEGORY_SHEET = 4


@dataclass
class MeetingHeader:
    title: str
    date: str = ""
    time: str = ""
    venue: str = ""


@dataclass
class SheetSpec:
    """One printed section: either a statutory sheet (1-9) or a category sheet."""

    title: str
    statutory_no: Optional[int] = None  # 1..9 → fixed sheet from statutory/NN.html
    category: Optional[str] = None  # otherwise → category sheet from the catalogue
    subtitle: str = ""


def _font_css() -> str:
    fonts = _HERE / "fonts"
    faces = [
        ("Noto Sans", 400, "NotoSans-Regular.ttf"),
        ("Noto Sans", 600, "NotoSans-SemiBold.ttf"),
        ("Noto Sans", 700, "NotoSans-Bold.ttf"),
        ("Noto Sans Kannada", 400, "NotoSansKannada-Regular.ttf"),
        ("Noto Sans Kannada", 500, "NotoSansKannada-SemiBold.ttf"),
        ("Noto Sans Kannada", 600, "NotoSansKannada-SemiBold.ttf"),
        ("Noto Sans Kannada", 700, "NotoSansKannada-Bold.ttf"),
    ]
    return "\n".join(
        f"@font-face {{ font-family: '{fam}'; font-weight: {w}; src: url('{(fonts / f).as_uri()}'); }}"
        for fam, w, f in faces
    )


def render_html(meeting: MeetingHeader, sheets: List[SheetSpec], *, orientation: str = "landscape") -> str:
    sections = []
    for no, spec in enumerate(sheets, start=1):
        if spec.statutory_no is not None:
            if not 1 <= spec.statutory_no <= STATUTORY_COUNT:
                raise ValueError(f"statutory sheet {spec.statutory_no} does not exist")
            tpl = _ENV.get_template(f"statutory/{spec.statutory_no:02d}.html")
            sections.append(tpl.render(no=no))
        else:
            sheet = sheet_for(spec.category or "")
            tpl = _ENV.get_template("category_section.html")
            sections.append(
                tpl.render(
                    no=no,
                    title=spec.title,
                    subtitle=spec.subtitle,
                    columns=sheet["columns"],
                    rows=range(1, _ROWS_PER_CATEGORY_SHEET + 1),
                )
            )
    return _ENV.get_template("document.html").render(
        meeting=meeting,
        sections=sections,
        font_css=_font_css(),
        sheet_css=(_HERE / "sheet.css").read_text(encoding="utf-8"),
        orientation="portrait" if orientation == "portrait" else "landscape",
    )


def _html_to_pdf(html: str) -> bytes:
    # Imported lazily so the rest of the app (and the tests that fake this) does
    # not need Pango installed.
    from weasyprint import HTML  # noqa: WPS433

    return HTML(string=html, base_url=str(_HERE)).write_pdf()


async def render_pdf(html: str) -> bytes:
    async with _RENDER_LOCK:
        return await asyncio.to_thread(_html_to_pdf, html)
