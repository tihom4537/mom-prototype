"""
Real-time Speech-to-Text over WebSocket, relayed to Sarvam AI's realtime
streaming API through the ``sarvamai`` SDK.

    browser  <->  WS /ws/speech-to-text  <->  Sarvam realtime STT

Client -> server:
  - binary frames : raw 16 kHz mono 16-bit little-endian PCM (no container)
  - text frame    : {"type": "end"} when the user stops recording

Server -> client (JSON text frames):
  - {"type": "ready",   "request_id": "..."}
  - {"type": "partial", "utterance": 0, "text": "..."}   (while speaking)
  - {"type": "final",   "utterance": 0, "text": "..."}   (after a pause)
  - {"type": "error",   "code": "...", "message": "...", "fatal": bool}
  - {"type": "end",     "audio_duration_s": 1.2, "total_utterances": 3}

Utterance boundaries come from Sarvam's voice-activity detection (default
sensitivity), so there is no clip-length limit and no flush signal to send.
"""

import asyncio
import base64
import json
import logging
import os
from typing import Any, Dict, List, Optional

from fastapi import WebSocket, WebSocketDisconnect
from sarvamai import AsyncSarvamAI, RealtimeAudioInput, RealtimeEnd
from sarvamai.core.api_error import ApiError

from .speech_to_text import _LANGUAGE_CODE_MAP


logger = logging.getLogger(__name__)


# Audio format the client must send as binary frames (raw PCM, no container).
STREAM_ENCODING = "linear16"
STREAM_SAMPLE_RATE = 16000

# Models Sarvam accepts on the realtime endpoint; keyterms only work on v4.
STREAM_MODELS = ("saaras:v3-realtime", "saaras:v4")
DEFAULT_STREAM_MODEL = "saaras:v3-realtime"

# After the client says "end", how long to wait for Sarvam to finalize the last
# utterance and close the session before we give up.
_FINAL_FLUSH_TIMEOUT = 15.0


async def _send(websocket: WebSocket, payload: dict) -> None:
    """Send a JSON event to the client, ignoring a client that already left."""
    try:
        await websocket.send_json(payload)
    except (WebSocketDisconnect, RuntimeError):
        pass


async def _forward_audio(websocket: WebSocket, sarvam) -> bool:
    """
    Client -> Sarvam. Binary frames are PCM audio; a ``{"type": "end"}`` text
    frame ends the session gracefully.

    Returns True if the client ended the session, False if it just disconnected.
    """
    while True:
        message = await websocket.receive()
        if message["type"] == "websocket.disconnect":
            return False

        chunk = message.get("bytes")
        if chunk:
            await sarvam.send_realtime_audio_input(
                RealtimeAudioInput(audio=base64.b64encode(chunk).decode("ascii"))
            )
            continue

        text = message.get("text")
        if not text:
            continue
        try:
            control = json.loads(text)
        except ValueError:
            continue
        if isinstance(control, dict) and control.get("type") == "end":
            await sarvam.send_realtime_end(RealtimeEnd())
            return True


class SessionSummary:
    """What happened in one relay session, for the audit row."""

    def __init__(self) -> None:
        self.request_id: Optional[str] = None
        self.finals: Dict[int, str] = {}
        self.audio_duration_s: Optional[float] = None
        self.total_utterances: Optional[int] = None
        self.outcome: str = "client_disconnected"
        self.error_code: Optional[str] = None

    @property
    def utterances(self) -> List[Dict[str, Any]]:
        return [{"idx": idx, "text": text} for idx, text in sorted(self.finals.items())]


async def _forward_transcripts(sarvam, websocket: WebSocket, summary: SessionSummary) -> None:
    """Sarvam -> client. Runs until Sarvam ends the session or reports a fatal error."""
    async for message in sarvam:
        event = getattr(message, "event", None)

        if event == "session.begin":
            summary.request_id = message.request_id
            await _send(websocket, {"type": "ready", "request_id": message.request_id})
        elif event == "transcript.partial":
            await _send(
                websocket,
                {
                    "type": "partial",
                    "utterance": message.utterance_idx,
                    "text": message.text,
                },
            )
        elif event == "transcript.final":
            summary.finals[message.utterance_idx] = message.text
            await _send(
                websocket,
                {
                    "type": "final",
                    "utterance": message.utterance_idx,
                    "text": message.text,
                },
            )
        elif event == "error":
            logger.error(
                "Sarvam realtime STT error (%s, fatal=%s): %s",
                message.code,
                message.is_fatal,
                message.message,
            )
            await _send(
                websocket,
                {
                    "type": "error",
                    "code": message.code,
                    "message": message.message,
                    "fatal": message.is_fatal,
                },
            )
            if message.is_fatal:
                summary.outcome = "provider_error"
                summary.error_code = str(message.code)
                return
        elif event == "session.end":
            summary.audio_duration_s = message.audio_duration_s
            summary.total_utterances = message.total_utterances
            summary.outcome = "completed"
            await _send(
                websocket,
                {
                    "type": "end",
                    "audio_duration_s": message.audio_duration_s,
                    "total_utterances": message.total_utterances,
                },
            )
            return


async def _relay(websocket: WebSocket, sarvam, summary: SessionSummary) -> None:
    uplink = asyncio.create_task(_forward_audio(websocket, sarvam))
    downlink = asyncio.create_task(_forward_transcripts(sarvam, websocket, summary))
    try:
        await asyncio.wait({uplink, downlink}, return_when=asyncio.FIRST_COMPLETED)
        client_ended = (
            uplink.done() and uplink.exception() is None and uplink.result()
        )
        if client_ended and not downlink.done():
            # Let Sarvam flush the final transcript of the last utterance.
            await asyncio.wait({downlink}, timeout=_FINAL_FLUSH_TIMEOUT)
    finally:
        uplink.cancel()
        downlink.cancel()
        results = await asyncio.gather(uplink, downlink, return_exceptions=True)

    for result in results:
        if isinstance(result, Exception):
            raise result


async def relay_realtime_transcription(
    websocket: WebSocket,
    *,
    locale: str,
    model: str = DEFAULT_STREAM_MODEL,
    keyterms: List[str] = (),
) -> SessionSummary:
    """
    Bridge an accepted client WebSocket to Sarvam's realtime STT WebSocket.
    Returns a SessionSummary describing what happened (for the audit row).

    Unlike the REST path in ``speech_to_text.py`` there is no clip-length limit:
    audio is forwarded as it arrives and transcripts come back per utterance
    (partials while speaking, a final when the speaker pauses).

    Never raises: failures are reported to the client as ``{"type": "error"}``.
    """
    # Read at call time (not import time) so a root .env loaded by main.py works.
    summary = SessionSummary()
    api_key = os.getenv("SARVAMAI_API_KEY")
    if not api_key:
        logger.error("SarvamAI API key is not set.")
        summary.outcome, summary.error_code = "server_error", "server_misconfigured"
        await _send(
            websocket,
            {
                "type": "error",
                "code": "server_misconfigured",
                "message": "Server configuration error: Missing API key.",
                "fatal": True,
            },
        )
        return summary

    client = AsyncSarvamAI(api_subscription_key=api_key)
    logger.info("Realtime STT session: locale=%s model=%s", locale, model)

    try:
        async with client.speech_to_text_realtime_streaming.connect(
            language_code=_LANGUAGE_CODE_MAP[locale],
            model=model,
            stream_type="fast",
            encoding=STREAM_ENCODING,
            sample_rate=str(STREAM_SAMPLE_RATE),
            # keyterms is a JSON-encoded array on the wire (saaras:v4 only).
            keyterms=json.dumps(list(keyterms), ensure_ascii=False) if keyterms else None,
        ) as sarvam:
            await _relay(websocket, sarvam, summary)
    except ApiError as exc:
        summary.outcome, summary.error_code = "provider_error", "provider_unavailable"
        logger.error(
            "Could not open Sarvam realtime STT session (status %s): %s",
            exc.status_code,
            exc.body,
        )
        await _send(
            websocket,
            {
                "type": "error",
                "code": "provider_unavailable",
                "message": "Speech-to-text provider rejected the connection",
                "fatal": True,
            },
        )
    except Exception as exc:
        summary.outcome, summary.error_code = "provider_error", "provider_failed"
        logger.exception("Realtime speech-to-text relay failed: %s", exc)
        await _send(
            websocket,
            {
                "type": "error",
                "code": "provider_failed",
                "message": "Speech-to-text provider failed",
                "fatal": True,
            },
        )
    return summary
