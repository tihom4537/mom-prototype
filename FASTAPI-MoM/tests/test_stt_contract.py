"""WS /ws/speech-to-text: event names and fields are ours, not the provider's."""
import json

import pytest
from starlette.websockets import WebSocketDisconnect

import gram_panchayat_api.main as main_mod
from gram_panchayat_api.models import (
    SttEndEvent, SttErrorEvent, SttFinalEvent, SttPartialEvent, SttReadyEvent,
)
from gram_panchayat_api.speech_to_text_streaming import SessionSummary

EVENT_KEYS = {
    "ready": {"type", "request_id"},
    "partial": {"type", "utterance", "text"},
    "final": {"type", "utterance", "text"},
    "error": {"type", "code", "message", "fatal"},
    "end": {"type", "audio_duration_s", "total_utterances"},
}
MODELS = {"ready": SttReadyEvent, "partial": SttPartialEvent, "final": SttFinalEvent,
          "error": SttErrorEvent, "end": SttEndEvent}


def assert_event(ev: dict) -> None:
    assert ev["type"] in EVENT_KEYS, ev
    assert set(ev) == EVENT_KEYS[ev["type"]], ev
    MODELS[ev["type"]].model_validate(ev)


def fake_relay(events):
    """Stand-in for relay_realtime_transcription: a provider that emits `events`."""
    async def _relay(websocket, *, locale, model, keyterms):
        summary = SessionSummary()
        summary.request_id = "req-1"
        for ev in events:
            await websocket.send_json(ev.model_dump())
        summary.outcome = "completed"
        return summary
    return _relay


def test_rejects_missing_token(client):
    with client.websocket_connect("/ws/speech-to-text?locale=kn") as ws:
        ev = ws.receive_json()
        assert_event(ev)
        assert ev == {"type": "error", "code": "unauthorized",
                      "message": "Invalid token: Not authenticated", "fatal": True}
        with pytest.raises(WebSocketDisconnect) as exc:
            ws.receive_text()
        assert exc.value.code == 1008


def test_rejects_bad_locale(client, token):
    with client.websocket_connect(f"/ws/speech-to-text?locale=hi&token={token}") as ws:
        ev = ws.receive_json()
        assert_event(ev)
        assert ev["code"] == "invalid_start" and ev["fatal"] is True


def test_header_auth_and_full_session(client, token, monkeypatch):
    monkeypatch.setattr(main_mod, "relay_realtime_transcription", fake_relay([
        SttReadyEvent(request_id="req-1"),
        SttPartialEvent(utterance=0, text="ನಮಸ್ಕಾ"),
        SttFinalEvent(utterance=0, text="ನಮಸ್ಕಾರ"),
        SttErrorEvent(code="chunk_too_large", message="frame too big", fatal=False),
        SttEndEvent(audio_duration_s=1.25, total_utterances=1),
    ]))
    with client.websocket_connect("/ws/speech-to-text?locale=kn",
                                  headers={"Authorization": f"Bearer {token}"}) as ws:
        seen = [ws.receive_json() for _ in range(5)]
    for ev in seen:
        assert_event(ev)
    assert [e["type"] for e in seen] == ["ready", "partial", "final", "error", "end"]
    assert seen[0]["request_id"] == "req-1"
    assert seen[4] == {"type": "end", "audio_duration_s": 1.25, "total_utterances": 1}


def test_query_token_accepted(client, token, monkeypatch):
    monkeypatch.setattr(main_mod, "relay_realtime_transcription",
                        fake_relay([SttReadyEvent(request_id="r"), SttEndEvent()]))
    with client.websocket_connect(f"/ws/speech-to-text?locale=en&token={token}") as ws:
        assert ws.receive_json()["type"] == "ready"
        end = ws.receive_json()
        assert_event(end)
        assert end["audio_duration_s"] is None and end["total_utterances"] is None
