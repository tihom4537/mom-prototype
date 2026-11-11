"""
Classify agenda items into the six fixed categories with one model call.

The model only ever emits a category label (constrained by a response schema);
columns and layout are attached by our code from the catalogue, so swapping
LLM_MODEL_NAME cannot change what a client receives.
"""
import json
import logging
import os
import time
from dataclasses import dataclass
from textwrap import dedent
from typing import Dict, List, Optional, Sequence

from ..json_utils import parse_first_json_object
from ..llm_client import generate_text
from ..prompts import CATEGORIES, DEFAULT_CATEGORY

logger = logging.getLogger(__name__)


class CategorisationError(Exception):
    """The model call failed or returned nothing usable; callers map this to 502."""


@dataclass
class AgendaToCategorise:
    id: str
    title: str
    description: str = ""


@dataclass
class Categorised:
    id: str
    category: str
    reason: str


@dataclass
class CategorisationResult:
    items: List[Categorised]
    model: str
    latency_ms: int


# Only the label is left to the model; everything else is deterministic.
CATEGORISE_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "items": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "id": {"type": "STRING"},
                    "category": {"type": "STRING", "enum": CATEGORIES},
                    "reason": {"type": "STRING"},
                },
                "required": ["id", "category"],
            },
        }
    },
    "required": ["items"],
}


def build_categorise_prompt(agendas: Sequence[AgendaToCategorise]) -> str:
    """
    Six-way classification of Gram Panchayat agenda items. Definitions and the
    per-category checklists are the categorisation part of the approved
    feedback prompt; feedback-writing instructions are deliberately left out.
    """
    listing = "\n".join(
        f'  {{"id": {json.dumps(a.id)}, "title": {json.dumps(a.title)}, "description": {json.dumps(a.description or "")}}}'
        for a in agendas
    )
    return dedent(
        f"""
        You are a classifier for Gram Panchayat (village council, Karnataka, India) meeting
        agenda items. Items may be written in English or Kannada. Assign EVERY item exactly
        one category from this fixed list, using the exact label:

        1. "Issue / Grievance" — a complaint, problem or demand raised by citizens or members
           that needs a decision or resolution. Typical record: what issue was raised, the
           discussion/response, the decision taken, who follows up, by when.
        2. "Review / Status" — a progress update or status check on ongoing work, a scheme,
           accounts, or a previous decision. Typical record: what was reviewed, current
           status, delays or gaps, instructions issued, whether further review is needed.
        3. "Planning / Preparatory" — a future activity, event, work or proposal being
           planned or prepared. Typical record: what is planned, preparatory steps,
           coordinator, tentative timeline, whether it is final or subject to approval.
        4. "Information / Intimation" — sharing of a circular, order, notification,
           announcement or update where the meeting mainly takes note. Typical record:
           source, what was shared, any clarification; a decision is not expected.
        5. "Multi-Topic / Miscellaneous" — one agenda item that bundles several distinct,
           unrelated subjects (for example "other matters", "matters under Section 58").
        6. "Other / Can't Categorize" — fits none of the above or has too little text to tell.

        Rules:
        - Judge by what the item is ABOUT, not by surface words; a title alone can be enough.
        - Choose "Multi-Topic / Miscellaneous" only when the item clearly spans several
          unrelated subjects, not merely because it is long.
        - Use "Other / Can't Categorize" sparingly, when nothing else fits.
        - Return one entry per input item, with the SAME "id" you were given, and a
          one-sentence "reason" in English.

        Agenda items (JSON):
        [
        {listing}
        ]

        Respond with JSON only: {{"items": [{{"id": "...", "category": "<exact label>", "reason": "..."}}]}}
        """
    ).strip()


def _model_name() -> str:
    return os.getenv("LLM_MODEL_NAME") or "gemini-2.5-flash"


async def categorise_agendas(agendas: Sequence[AgendaToCategorise]) -> CategorisationResult:
    """
    One model call for all `agendas`. Raises CategorisationError when the call
    fails or the output cannot be matched back to the inputs.
    """
    if not agendas:
        return CategorisationResult(items=[], model=_model_name(), latency_ms=0)

    prompt = build_categorise_prompt(agendas)
    started = time.monotonic()
    try:
        raw = await generate_text(
            prompt,
            response_mime_type="application/json",
            generation_config={"responseSchema": CATEGORISE_RESPONSE_SCHEMA},
        )
        data = parse_first_json_object(raw)
    except Exception as exc:
        logger.exception("Agenda categorisation failed: %s", exc)
        raise CategorisationError(str(exc)) from exc
    latency_ms = int((time.monotonic() - started) * 1000)

    by_id: Dict[str, Categorised] = {}
    for entry in data.get("items") or []:
        if not isinstance(entry, dict):
            continue
        item_id = str(entry.get("id", "")).strip()
        category = str(entry.get("category", "")).strip()
        by_id[item_id] = Categorised(
            id=item_id,
            category=category if category in CATEGORIES else DEFAULT_CATEGORY,
            reason=str(entry.get("reason") or "").strip(),
        )

    # Keep input order; the model may reorder or (rarely) drop an item. A dropped
    # item falls back to the default category rather than failing the whole call,
    # but if the model returned nothing matching at all, that is a failure.
    items: List[Categorised] = []
    matched = 0
    for a in agendas:
        hit: Optional[Categorised] = by_id.get(a.id)
        if hit is None:
            items.append(Categorised(id=a.id, category=DEFAULT_CATEGORY, reason="not returned by the model"))
        else:
            matched += 1
            items.append(hit)
    if matched == 0:
        raise CategorisationError("model output did not reference any input id")

    return CategorisationResult(items=items, model=_model_name(), latency_ms=latency_ms)
