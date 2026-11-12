"""POST /feedback: the response shape must not depend on what the model returns."""
import json

import pytest

import gram_panchayat_api.feedback as feedback_mod
import gram_panchayat_api.main as main_mod
from gram_panchayat_api.models import FeedbackResult

RESPONSE_KEYS = {"status", "message", "feedback", "rewrite"}
ITEM_KEYS = {"text", "highlight"}

BODY = {
    "agenda_id": "AG-001",
    "agenda_subject": "Road repair in Ward 5",
    "mom_discussion": "Members discussed potholes on the main street and resolved to prepare an estimate.",
    "feedback_language": "en",
}


def fake_llm(payload):
    """Return a coroutine function that stands in for llm_client.generate_text."""
    async def _generate(prompt, **kwargs):
        return payload if isinstance(payload, str) else json.dumps(payload)
    return _generate


def assert_contract(data: dict) -> None:
    assert set(data) == RESPONSE_KEYS, f"unexpected keys: {set(data) ^ RESPONSE_KEYS}"
    assert data["status"] in ("feedback", "good_to_go")
    assert data["message"] is None or isinstance(data["message"], str)
    assert data["rewrite"] is None or isinstance(data["rewrite"], str)
    assert isinstance(data["feedback"], list)
    for item in data["feedback"]:
        assert set(item) == ITEM_KEYS
        assert isinstance(item["text"], str) and item["text"]
        assert item["highlight"] is None or item["highlight"] in item["text"]
    # And it must round-trip through the published model.
    FeedbackResult.model_validate(data)


def test_requires_token(client):
    assert client.post("/feedback", json=BODY).status_code == 401


def test_rejects_bad_body(client, token):
    r = client.post("/feedback", json={**BODY, "feedback_language": "hi"}, headers=auth(token))
    assert r.status_code == 422
    r = client.post("/feedback", json={**BODY, "mom_discussion": "   "}, headers=auth(token))
    assert r.status_code == 422


def test_round_one_feedback_shape(client, token, monkeypatch):
    monkeypatch.setattr(feedback_mod, "generate_text", fake_llm({
        "category": "Issue / Grievance",
        "good_to_go": False,
        "feedback": [
            "Could you add the {{date by which the estimate is due}}?",
            "Good: the responsible office is named.",
        ],
        "rewrite": "Members discussed potholes ... by [[date]].",
    }))
    r = client.post("/feedback", json=BODY, headers=auth(token))
    assert r.status_code == 200
    data = r.json()
    assert_contract(data)
    assert data["status"] == "feedback"
    assert data["message"] is None
    assert data["feedback"][0] == {
        "text": "Could you add the date by which the estimate is due?",
        "highlight": "date by which the estimate is due",
    }
    assert data["feedback"][1]["highlight"] is None
    assert "{{" not in json.dumps(data), "marker syntax must never leak to the client"


def test_good_to_go_shape(client, token, monkeypatch):
    monkeypatch.setattr(feedback_mod, "generate_text", fake_llm({
        "category": "Review / Status",
        "good_to_go": True,
        "message": "",
        "feedback": [],
        "rewrite": "Final text.",
    }))
    data = client.post("/feedback", json=BODY, headers=auth(token)).json()
    assert_contract(data)
    assert data["status"] == "good_to_go"
    assert data["feedback"] == []
    assert data["message"] == "Great, you are good to go!"  # server default, not the model's


def test_kannada_default_message(client, token, monkeypatch):
    monkeypatch.setattr(feedback_mod, "generate_text", fake_llm({
        "category": "Review / Status", "good_to_go": True, "feedback": [], "rewrite": "x",
    }))
    data = client.post("/feedback", json={**BODY, "feedback_language": "kn"}, headers=auth(token)).json()
    assert_contract(data)
    assert data["message"] == "ಚೆನ್ನಾಗಿದೆ, ನೀವು ಮುಂದುವರಿಯಬಹುದು!"


def test_model_failure_is_502_not_an_empty_200(client, token, monkeypatch):
    """A dead or garbled model must surface as an error the caller can retry on."""
    monkeypatch.setattr(feedback_mod, "generate_text", fake_llm("not json at all"))
    r = client.post("/feedback", json=BODY, headers=auth(token))
    assert r.status_code == 502
    assert r.json() == {"detail": "Feedback is temporarily unavailable"}

    async def boom(*a, **k):
        raise RuntimeError("provider down")
    monkeypatch.setattr(feedback_mod, "generate_text", boom)
    assert client.post("/feedback", json=BODY, headers=auth(token)).status_code == 502


@pytest.mark.parametrize("raw", [
    '{"category": "Something new", "feedback": "- a\\n- b", "rewrite": 42}',
    '{"feedback": [{"suggestion": "old object shape {{x}}"}], "unknown_field": true}',
    '```json\n{"category": "Issue / Grievance", "good_to_go": false, "feedback": ["a"], "rewrite": "r"}\n```',
])
def test_model_misbehaviour_never_changes_shape(client, token, monkeypatch, raw):
    """Whatever a future model emits, the client sees the same four keys."""
    monkeypatch.setattr(feedback_mod, "generate_text", fake_llm(raw))
    r = client.post("/feedback", json=BODY, headers=auth(token))
    assert r.status_code == 200
    assert_contract(r.json())


def test_follow_up_round_shape(client, token, monkeypatch):
    """Second round uses the other prompt but the same response contract."""
    async def previous(agenda_id):
        return {
            "status": "feedback", "round": 1,
            "feedback": ["Could you add the date?"],
            "mom_discussion": BODY["mom_discussion"],
            "created_at": None,
        }
    monkeypatch.setattr(main_mod, "fetch_last_feedback", previous)
    seen = {}
    async def _generate(prompt, **kwargs):
        seen["prompt"] = prompt
        return json.dumps({"category": "Issue / Grievance", "good_to_go": False,
                           "message": "", "feedback": ["Still missing the {{date}}."], "rewrite": "r"})
    monkeypatch.setattr(feedback_mod, "generate_text", _generate)
    edited = {**BODY, "mom_discussion": BODY["mom_discussion"] + " The estimate will cost Rs 2 lakh."}
    data = client.post("/feedback", json=edited, headers=auth(token)).json()
    assert_contract(data)
    assert "Could you add the date?" in seen["prompt"], "previous points must reach prompt 2"


def test_response_schema_is_sent_to_the_model(client, token, monkeypatch):
    """The Gemini call must carry the response schema so a model swap stays constrained."""
    seen = {}
    async def _generate(prompt, **kwargs):
        seen.update(kwargs)
        return json.dumps({"category": "Issue / Grievance", "good_to_go": False, "feedback": [], "rewrite": "r"})
    monkeypatch.setattr(feedback_mod, "generate_text", _generate)
    client.post("/feedback", json=BODY, headers=auth(token))
    assert seen["response_mime_type"] == "application/json"
    schema = seen["generation_config"]["responseSchema"]
    assert set(schema["properties"]) == {"category", "good_to_go", "message", "feedback", "rewrite"}


def auth(token):
    return {"Authorization": f"Bearer {token}"}
