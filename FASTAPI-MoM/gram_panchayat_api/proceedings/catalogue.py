"""
Proceedings column catalogue: one table layout per agenda category.

This is the single source of truth for the category sheets. The JSON endpoint
returns it, the PDF renderer draws it, and the contract tests freeze it. The
labels, widths and cell kinds mirror the approved mockup (category-a4.html).

Column `kind`:
  serial            cell shows the row number (1, 2, 3 ...)
  text              blank cell for handwriting
  yes_no            cell pre-printed "ಹೌದು / ಇಲ್ಲ · Yes / No"
  final_or_approval cell pre-printed "ಅಂತಿಮ / ಅನುಮೋದನೆಗೆ ಒಳಪಟ್ಟಿದೆ · Final / Subject to approval"
"""
from typing import Dict, List, TypedDict

from ..prompts import CATEGORIES, DEFAULT_CATEGORY


class Column(TypedDict):
    key: str
    label_kn: str
    label_en: str
    width_pct: int
    kind: str


class CategorySheet(TypedDict):
    category: str
    title_kn: str
    title_en: str
    columns: List[Column]


def _col(key: str, kn: str, en: str, width: int, kind: str = "text") -> Column:
    return {"key": key, "label_kn": kn, "label_en": en, "width_pct": width, "kind": kind}


SL_NO = _col("sl_no", "ಕ್ರ.ಸಂ", "Sl.No", 5, "serial")
SUBJECT = ("subject", "ವಿಷಯ / ಸಮಸ್ಯೆ / ಕುಂದುಕೊರತೆ", "Issue / Grievance / Subject")
DISCUSSION_INFO = ("discussion_information", "ಚರ್ಚೆ / ಮಾಹಿತಿ", "Discussion / Information")
DECISION = ("decision_action", "ತೀರ್ಮಾನ / ಕೈಗೊಳ್ಳಬೇಕಾದ ಕ್ರಮ", "Decision / Action to be taken")
RESPONSIBLE = ("responsible", "ಜವಾಬ್ದಾರಿ ಇರುವ ವ್ಯಕ್ತಿ ಅಥವಾ ಸಂಸ್ಥೆ", "Responsible person / org")
TIMELINE = ("timeline", "ಕಾಲಮಿತಿ / ಅನುಸರಣಾ ಕ್ರಮ", "Timeline / Follow-up")

CATALOGUE: Dict[str, CategorySheet] = {
    "Issue / Grievance": {
        "category": "Issue / Grievance",
        "title_kn": "ಸಮಸ್ಯೆ / ಕುಂದುಕೊರತೆ",
        "title_en": "Issue / Grievance",
        "columns": [
            SL_NO,
            _col(*SUBJECT, 20),
            _col(*DISCUSSION_INFO, 27),
            _col(*DECISION, 24),
            _col(*RESPONSIBLE, 12),
            _col(*TIMELINE, 12),
        ],
    },
    "Review / Status": {
        "category": "Review / Status",
        "title_kn": "ಪರಿಶೀಲನೆ / ಪ್ರಗತಿ ಸ್ಥಿತಿ",
        "title_en": "Review / Status",
        "columns": [
            SL_NO,
            _col(*SUBJECT, 18),
            _col("progress_status", "ಪ್ರಗತಿ / ಸ್ಥಿತಿ", "Progress / Status", 20),
            _col("delays_gaps", "ವಿಳಂಬ / ಅಂತರ / ಆತಂಕಗಳು", "Delays / gaps / concerns", 21),
            _col(*DECISION, 25),
            _col("further_review", "ಮತ್ತಷ್ಟು ಪರಿಶೀಲನೆ ಅಗತ್ಯವೇ?", "Further review required?", 11, "yes_no"),
        ],
    },
    "Planning / Preparatory": {
        "category": "Planning / Preparatory",
        "title_kn": "ಯೋಜನೆ / ಪೂರ್ವಸಿದ್ಧತೆ",
        "title_en": "Planning / Preparatory",
        "columns": [
            SL_NO,
            _col("activity_planned", "ಯೋಜಿಸುತ್ತಿರುವ ಚಟುವಟಿಕೆ / ಕಾರ್ಯಕ್ರಮ", "Activity / event being planned", 22),
            _col(*DISCUSSION_INFO, 33),
            _col(*RESPONSIBLE, 14),
            _col(*TIMELINE, 13),
            _col("final_or_approval", "ಅಂತಿಮವೇ ಅಥವಾ ಅನುಮೋದನೆಗೆ ಒಳಪಟ್ಟಿದೆಯೇ?", "Final or subject to approval?", 13, "final_or_approval"),
        ],
    },
    "Information / Intimation": {
        "category": "Information / Intimation",
        "title_kn": "ಮಾಹಿತಿ / ಸೂಚನೆ",
        "title_en": "Information / Intimation",
        "columns": [
            SL_NO,
            _col("information_shared", "ಹಂಚಿಕೊಂಡ ಮಾಹಿತಿ / ನವೀಕರಣ", "Information / update shared", 28),
            _col("source", "ಮೂಲ", "Source", 13),
            _col("discussion", "ಚರ್ಚೆ", "Discussion", 27),
            _col(*DECISION, 27),
        ],
    },
    "Multi-Topic / Miscellaneous": {
        "category": "Multi-Topic / Miscellaneous",
        "title_kn": "ಬಹುವಿಷಯ / ವಿವಿಧ",
        "title_en": "Multi-Topic / Miscellaneous",
        "columns": [
            SL_NO,
            _col(*SUBJECT, 28),
            _col(*DECISION, 42),
            _col(*TIMELINE, 25),
        ],
    },
    "Other / Can't Categorize": {
        "category": "Other / Can't Categorize",
        "title_kn": "ಇತರೆ",
        "title_en": "Other",
        "columns": [
            SL_NO,
            _col(*SUBJECT, 18),
            _col(*DISCUSSION_INFO, 28),
            _col(*DECISION, 25),
            _col(*RESPONSIBLE, 12),
            _col(*TIMELINE, 12),
        ],
    },
}

assert set(CATALOGUE) == set(CATEGORIES), "catalogue and prompts.CATEGORIES out of sync"
for _sheet in CATALOGUE.values():
    assert sum(c["width_pct"] for c in _sheet["columns"]) == 100, _sheet["category"]


def sheet_for(category: str) -> CategorySheet:
    return CATALOGUE.get(category) or CATALOGUE[DEFAULT_CATEGORY]


# Pre-printed cell text for the non-blank kinds.
CELL_TEXT = {
    "yes_no": ("ಹೌದು / ಇಲ್ಲ", "Yes / No"),
    "final_or_approval": ("ಅಂತಿಮ / ಅನುಮೋದನೆಗೆ ಒಳಪಟ್ಟಿದೆ", "Final / Subject to approval"),
}

STATUTORY_COUNT = 13
