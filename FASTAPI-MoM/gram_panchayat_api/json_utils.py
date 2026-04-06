import json
from typing import Any, Dict


def parse_first_json_object(text: str) -> Dict[str, Any]:
    """
    Best-effort parser for LLM outputs that are *supposed* to be JSON.

    Handles common LLM deviations:
    - leading/trailing whitespace
    - fenced code blocks (```json ... ``` or ``` ... ```)
    - extra text before/after the JSON object

    Strategy:
    - strip code fences if present
    - scan for the first JSON object using JSONDecoder.raw_decode
    """
    s = (text or "").strip()
    if not s:
        raise ValueError("Empty response")

    # Remove common markdown code fences.
    if "```" in s:
        lines = [ln for ln in s.splitlines() if not ln.strip().startswith("```")]
        s = "\n".join(lines).strip()

    decoder = json.JSONDecoder()
    for idx, ch in enumerate(s):
        if ch != "{":
            continue
        try:
            obj, _end = decoder.raw_decode(s[idx:])
            if isinstance(obj, dict):
                return obj
        except json.JSONDecodeError:
            continue

    raise ValueError("No JSON object found in response")

