import logging
from typing import List, Optional, Tuple

from .llm_client import LLMClientError, generate_text
from .json_utils import parse_first_json_object
from .prompts import CATEGORIES, DEFAULT_CATEGORY, build_single_call_prompt


logger = logging.getLogger(__name__)


def parse_bulleted_feedback(raw: str) -> List[str]:
    """Parse a bulleted string into a clean list of feedback points."""
    feedback_points: List[str] = []
    for line in raw.splitlines():
        stripped = line.strip()
        if not stripped:
            continue
        if stripped[0] in ("-", "*", "•"):
            stripped = stripped[1:].strip()
        if stripped:
            feedback_points.append(stripped)
    return feedback_points


async def get_feedback(
    agenda_subject: str,
    mom_discussion: str,
    feedback_language: str = 'en',
) -> Tuple[str, str, List[str], str, bool, List[Optional[str]]]:
    """
    Single LLM call that both categorizes and generates feedback.

    Returns:
        (category, reason, feedback_list, feedback_raw, failed)
    """
    prompt = build_single_call_prompt(agenda_subject, mom_discussion, feedback_language)

    try:
        raw = await generate_text(prompt, response_mime_type="application/json")
        data = parse_first_json_object(raw)

        category = (data.get("category") or "").strip()
        reason = (data.get("reason") or data.get("category_reason") or "").strip()
        feedback_raw_value = data.get("feedback") or []

        if category not in CATEGORIES:
            category = DEFAULT_CATEGORY

        spans_list: List[Optional[str]] = []
        if isinstance(feedback_raw_value, list):
            if feedback_raw_value and isinstance(feedback_raw_value[0], dict):
                # New format: list of {span, suggestion} objects
                feedback_list = []
                for item in feedback_raw_value:
                    suggestion = str(item.get("suggestion") or "").strip()
                    span = item.get("span") or None
                    if isinstance(span, str):
                        span = span.strip() or None
                    if suggestion:
                        feedback_list.append(suggestion)
                        spans_list.append(span)
                feedback_raw = "\n".join(f"- {s}" for s in feedback_list)
            else:
                # Legacy format: plain list of strings
                feedback_list = [str(item).strip() for item in feedback_raw_value if str(item).strip()]
                spans_list = [None] * len(feedback_list)
                feedback_raw = "\n".join(f"- {item}" for item in feedback_list)
        else:
            feedback_raw = str(feedback_raw_value).strip()
            feedback_list = parse_bulleted_feedback(feedback_raw)
            spans_list = [None] * len(feedback_list)

        failed = False
        return category, reason, feedback_list, feedback_raw, failed, spans_list

    except (LLMClientError, Exception) as exc:
        logger.exception(
            "Single-call categorize+feedback failed for agenda '%s': %s",
            agenda_subject,
            exc,
        )
        category = DEFAULT_CATEGORY
        reason = f"Categorization+feedback failed: {exc}"
        feedback_raw = f"ERROR: {exc}"
        feedback_list: List[str] = []
        return category, reason, feedback_list, feedback_raw, True, []

