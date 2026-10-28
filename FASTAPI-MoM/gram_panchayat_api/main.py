"""
Sample curl:

curl -X POST "http://localhost:8000/feedback" \
  -H "Content-Type: application/json" \
  -d '{
        "agenda_id": "AG-001",
        "agenda_subject": "Road repair in Ward 5",
        "mom_discussion": "Members discussed potholes on the main street and resolved to prepare an estimate and submit a proposal to the district office."
      }'
"""

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

from dotenv import load_dotenv
import jwt
from fastapi import Depends, FastAPI, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware

from .auth import decode_token, require_auth
from .db import (
    close_db_pool,
    fetch_last_feedback,
    init_db_pool,
    insert_ai_feedback,
    insert_stt_session,
)
from .feedback import GOOD_TO_GO_MESSAGE, get_feedback as run_feedback, is_fresh_start
from .models import (
    FeedbackItem,
    FeedbackRequest,
    FeedbackResult,
    OCRRequest,
    OCRResponse,
    SpeechToTextRequest,
    SpeechToTextResponse,
    TranslateRequest,
    TranslateResponse,
)
from .ocr import process_image_ocr
from .speech_to_text import transcribe_audio_data_uri
from .speech_to_text import _LANGUAGE_CODE_MAP
from .speech_to_text_streaming import DEFAULT_STREAM_MODEL, relay_realtime_transcription
from .translate import translate_text


load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application startup and shutdown."""
    await init_db_pool()
    yield
    await close_db_pool()


app = FastAPI(title="Gram Panchayat Meeting Feedback API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict:
    """Simple health check endpoint."""
    return {"status": "ok"}


@app.post("/feedback", response_model=FeedbackResult)
async def get_feedback(body: FeedbackRequest, _claims: dict = Depends(require_auth)) -> FeedbackResult:
    """
    AI feedback on one agenda item's minutes.

    Round one classifies the item and reviews it against the category checklist.
    If feedback was already stored for this `agenda_id` and the new minutes are
    an edit of the previous text, the call becomes a follow-up round: the model
    checks which earlier points are now addressed and returns only what is still
    open, or `status: "good_to_go"` once roughly 70% has been addressed. If the
    minutes were replaced rather than edited (word overlap with the previous
    round below 20%), the backend starts a fresh round 1 on its own.

    Classification (category, reason) is kept in the audit table, not returned.
    """
    previous = await fetch_last_feedback(body.agenda_id)
    round_no, previous_points = 1, None
    if previous and previous["status"] == "feedback" and previous["feedback"]:
        if is_fresh_start(previous.get("mom_discussion", ""), body.mom_discussion):
            logger.info("Agenda %s: minutes replaced since round %s; starting fresh", body.agenda_id, previous["round"])
        else:
            round_no = int(previous["round"]) + 1
            previous_points = previous["feedback"]

    outcome = await run_feedback(
        body.agenda_subject,
        body.mom_discussion,
        body.feedback_language,
        previous_feedback=previous_points,
    )

    good_to_go = outcome.good_to_go
    if good_to_go and not outcome.message:
        outcome.message = GOOD_TO_GO_MESSAGE.get(body.feedback_language, GOOD_TO_GO_MESSAGE["en"])

    result = FeedbackResult(
        status="good_to_go" if good_to_go else "feedback",
        message=outcome.message if good_to_go else None,
        feedback=[] if good_to_go else [FeedbackItem(text=t, highlight=h) for t, h in outcome.items],
        rewrite=outcome.rewrite,
    )

    logger.info(
        "Agenda %r (%s) round %d -> %s, category %r%s",
        body.agenda_subject, body.agenda_id, round_no, result.status, outcome.category,
        " [LLM FAILED]" if outcome.failed else "",
    )

    # Only persist when the model call succeeded; a failed call must not become
    # the "previous feedback" of the next round.
    if not outcome.failed:
        try:
            await insert_ai_feedback(
                agenda_id=body.agenda_id,
                input_payload=body.model_dump(),
                output_payload=result.model_dump(),
                category=outcome.category,
                category_reason=outcome.reason,
                status=result.status,
                round_no=round_no,
                model=outcome.model,
                latency_ms=outcome.latency_ms,
            )
        except Exception as exc:  # pragma: no cover - best-effort audit
            logger.exception("Failed to insert ai_feedback for agenda_id=%s: %s", body.agenda_id, exc)

    return result


@app.post("/speech-to-text", response_model=SpeechToTextResponse)
async def speech_to_text(body: SpeechToTextRequest, _claims: dict = Depends(require_auth)) -> SpeechToTextResponse:
    """
    Transcribe short audio using SarvamAI Speech-to-Text REST API.

    The request body mirrors the TypeScript `speechToText` function:
    - `audioDataUri`: data URI string containing Base64-encoded audio.
    - `locale`: expected language of the audio (e.g., "en" or "kn").
    """
    transcription = await transcribe_audio_data_uri(
        body.audioDataUri,
        body.locale,
    )
    return SpeechToTextResponse(transcription=transcription)


@app.post("/translate", response_model=TranslateResponse)
async def translate(body: TranslateRequest, _claims: dict = Depends(require_auth)) -> TranslateResponse:
    """
    Translate meeting minutes text between English (en) and Kannada (kn).
    Uses the LLM to preserve proper nouns and official document style.
    """
    translation = await translate_text(body.text, body.from_locale, body.to_locale)
    return TranslateResponse(translation=translation)


@app.post("/ocr", response_model=OCRResponse)
async def ocr(body: OCRRequest, _claims: dict = Depends(require_auth)) -> OCRResponse:
    """
    Extract text from an image using Google Cloud Vision API.

    Supports JPG and PNG images up to 5MB.
    Automatically detects if text is English or Kannada.
    """
    result = await process_image_ocr(body.image, body.format)
    return OCRResponse(**result)


@app.websocket("/ws/speech-to-text")
async def websocket_speech_to_text(
    websocket: WebSocket,
    locale: str = "kn",
    agenda_id: Optional[str] = None,
    token: Optional[str] = None,
) -> None:
    """
    Real-time transcription over a WebSocket, relayed to Sarvam AI's realtime
    Speech-to-Text API. No clip-length limit (POST /speech-to-text is for
    short clips).

    Query params:
    - `locale`: "kn" (default) or "en".
    - `agenda_id`: optional; recorded in the audit row so a transcript can be
      traced to the agenda item it was dictated for.
    - `token`: the JWT, for clients that cannot set a header on the handshake.
      Backends should send `Authorization: Bearer <JWT>` on the handshake instead.

    Client -> server: binary frames of raw 16 kHz mono 16-bit PCM, then a text
    frame `{"type": "end"}`.

    Server -> client (JSON text frames): `ready`, `partial`, `final`, `error`, `end`.
    """
    await websocket.accept()
    started_at = datetime.now(timezone.utc)

    if not token:
        scheme, _, credentials = websocket.headers.get("authorization", "").partition(" ")
        if scheme.lower() == "bearer":
            token = credentials.strip()
    try:
        if not token:
            raise jwt.InvalidTokenError("Not authenticated")
        decode_token(token)
    except jwt.ExpiredSignatureError:
        await _reject_stream(websocket, "unauthorized", "Token has expired")
        return
    except jwt.InvalidTokenError as exc:
        await _reject_stream(websocket, "unauthorized", f"Invalid token: {exc}")
        return
    except RuntimeError as exc:
        logger.error("JWT verification misconfigured: %s", exc)
        await _reject_stream(websocket, "unauthorized", "Authentication is not configured correctly")
        return

    if locale not in _LANGUAGE_CODE_MAP:
        await _reject_stream(
            websocket, "invalid_start",
            f"Unsupported locale {locale!r}; expected one of {sorted(_LANGUAGE_CODE_MAP)}",
        )
        return

    summary = await relay_realtime_transcription(
        websocket, locale=locale, model=DEFAULT_STREAM_MODEL, keyterms=[]
    )

    try:
        await websocket.close()
    except (WebSocketDisconnect, RuntimeError):
        pass  # client already gone

    try:
        await insert_stt_session(
            request_id=summary.request_id,
            agenda_id=agenda_id,
            locale=locale,
            model=DEFAULT_STREAM_MODEL,
            utterances=summary.utterances,
            audio_duration_s=summary.audio_duration_s,
            total_utterances=summary.total_utterances,
            outcome=summary.outcome,
            error_code=summary.error_code,
            started_at=started_at,
        )
    except Exception as exc:  # pragma: no cover - best-effort audit
        logger.exception("Failed to insert stt_session: %s", exc)


async def _reject_stream(websocket: WebSocket, code: str, message: str) -> None:
    """Tell the client why the stream was refused, then close (1008 = policy violation)."""
    try:
        await websocket.send_json({"type": "error", "code": code, "message": message, "fatal": True})
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
    except (WebSocketDisconnect, RuntimeError):
        pass


# If you want to run with: `python -m gram_panchayat_api.main`
if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run("gram_panchayat_api.main:app", host="0.0.0.0", port=8000, reload=True)

