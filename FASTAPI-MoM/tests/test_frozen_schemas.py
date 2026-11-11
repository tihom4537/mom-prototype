"""
The JSON Schemas in tests/contracts/ are the handed-over contract. If a change
to models.py alters them, this test fails: regenerate deliberately with
    python -m tests.test_frozen_schemas --write
and re-issue the integration document.
"""
import json
import sys
from pathlib import Path

from pydantic import TypeAdapter

from gram_panchayat_api.models import FeedbackRequest, FeedbackResult, SttEvent

CONTRACTS = Path(__file__).parent / "contracts"
SCHEMAS = {
    "feedback_request.schema.json": lambda: FeedbackRequest.model_json_schema(),
    "feedback_response.schema.json": lambda: FeedbackResult.model_json_schema(),
    "stt_events.schema.json": lambda: TypeAdapter(SttEvent).json_schema(),
}


def test_schemas_unchanged():
    for name, build in SCHEMAS.items():
        frozen = json.loads((CONTRACTS / name).read_text())
        assert build() == frozen, f"{name} changed: the public contract moved"


if __name__ == "__main__" and "--write" in sys.argv:
    CONTRACTS.mkdir(exist_ok=True)
    for name, build in SCHEMAS.items():
        (CONTRACTS / name).write_text(json.dumps(build(), indent=2, ensure_ascii=False) + "\n")
        print("wrote", CONTRACTS / name)
