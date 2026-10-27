import logging
import os
import re
import time
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

from .llm_client import LLMClientError, generate_text
from .json_utils import parse_first_json_object
from .prompts import (
    CATEGORIES,
    DEFAULT_CATEGORY,
    build_refeedback_prompt,
    build_single_call_prompt,
)


logger = logging.getLogger(__name__)

# Inline highlight marker the prompt asks the model to put around the missing detail.
_MARKER = re.compile(r"\{\{\s*(.+?)\s*\}\}", re.S)

GOOD_TO_GO_MESSAGE = {
    "en": "Great, you are good to go!",
    "kn": "ಚೆನ್ನಾಗಿದೆ, ನೀವು ಮುಂದುವರಿಯಬಹುದು!",
}


@dataclass
class FeedbackOutcome:
    """Everything one feedback call produced; main.py decides what the client sees."""

    category: str = DEFAULT_CATEGORY
    reason: str = ""
    good_to_go: bool = False
    message: Optional[str] = None
    items: List[Tuple[str, Optional[str]]] = field(default_factory=list)  # (text, highlight)
    rewrite: Optional[str] = None
    model: str = ""
    latency_ms: int = 0
    failed: bool = False


def split_highlight(point: str) -> Tuple[str, Optional[str]]:
    """
    Turn "Could you specify the {{month and year}}?" into
    ("Could you specify the month and year?", "month and year").

    The first well-formed marker becomes the highlight; every marker is removed
    from the text and any stray brace pairs are dropped, so the client always
    gets clean text and a highlight that is guaranteed to be a substring of it.
    """
    match = _MARKER.search(point)
    highlight = match.group(1).strip() if match else None
    text = _MARKER.sub(lambda m: m.group(1).strip(), point)
    text = text.replace("{{", "").replace("}}", "").strip()
    if highlight and highlight not in text:
        highlight = None
    return text, highlight or None


def _model_name() -> str:
    return os.getenv("LLM_MODEL_NAME") or "gemini-2.5-flash"


async def get_feedback(
    agenda_subject: str,
    mom_discussion: str,
    feedback_language: str = "en",
    previous_feedback: Optional[List[str]] = None,
) -> FeedbackOutcome:
    """
    One LLM call that classifies the item and produces feedback plus a rewrite.

    Round one uses the full checklist prompt. When `previous_feedback` is given
    (the points shown to the user last time) the re-feedback prompt checks what
    has been addressed and returns only what is still open, or good_to_go.

    Never raises: on any failure the outcome has `failed=True`.
    """
    is_followup = bool(previous_feedback)
    logger.info(
        "Feedback request: language=%r agenda=%r followup=%s",
        feedback_language, agenda_subject, is_followup,
    )
    prompt = (
        build_refeedback_prompt(agenda_subject, mom_discussion, previous_feedback or [], feedback_language)
        if is_followup
        else build_single_call_prompt(agenda_subject, mom_discussion, feedback_language)
    )

    outcome = FeedbackOutcome(model=_model_name())
    started = time.monotonic()
    try:
        raw = await generate_text(prompt, response_mime_type="application/json")
        outcome.latency_ms = int((time.monotonic() - started) * 1000)
        data = parse_first_json_object(raw)

        category = (data.get("category") or "").strip()
        outcome.category = category if category in CATEGORIES else DEFAULT_CATEGORY
        outcome.reason = (data.get("reason") or data.get("category_reason") or "").strip()
        outcome.rewrite = (data.get("rewrite") or "").strip() or None

        points = data.get("feedback") or []
        if isinstance(points, str):
            points = [line.lstrip("-*• ").strip() for line in points.splitlines() if line.strip()]
        for point in points:
            if isinstance(point, dict):  # tolerate an older object shape
                point = point.get("suggestion") or point.get("text") or ""
            point = str(point).strip()
            if point:
                outcome.items.append(split_highlight(point))

        outcome.good_to_go = bool(data.get("good_to_go"))
        if outcome.good_to_go:
            message = (data.get("message") or "").strip()
            outcome.message = message or GOOD_TO_GO_MESSAGE.get(feedback_language, GOOD_TO_GO_MESSAGE["en"])
        return outcome

    except (LLMClientError, Exception) as exc:
        outcome.latency_ms = int((time.monotonic() - started) * 1000)
        logger.exception("Feedback call failed for agenda %r: %s", agenda_subject, exc)
        outcome.failed = True
        outcome.reason = f"Feedback failed: {exc}"
        return outcome
