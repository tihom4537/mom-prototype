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

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import close_db_pool, init_db_pool, insert_ai_feedback
from .feedback import get_feedback as run_feedback
from .models import (
    FeedbackRequest,
    FeedbackResult,
    SpeechToTextRequest,
    SpeechToTextResponse,
    TranslateRequest,
    TranslateResponse,
)
from .speech_to_text import transcribe_audio_data_uri
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
async def get_feedback(body: FeedbackRequest) -> FeedbackResult:
    """
    Generate AI feedback for a single Gram Panchayat meeting item using
    a single LLM prompt that both categorizes and provides feedback.

    Current schema (experimental, may evolve):
    - Input JSON:
      {
        "agenda_id": "string (required, non-empty)",
        "agenda_subject": "string (required, non-empty)",
        "mom_discussion": "string (required, non-empty)"
      }
    - Output JSON:
      {
        "category": "string",
        "category_reason": "string",
        "feedback": ["string"]
      }
    """
    (
        category,
        reason,
        feedback,
        _feedback_raw,
        failed,
        spans,
    ) = await run_feedback(
        body.agenda_subject,
        body.mom_discussion,
        body.feedback_language,
    )

    logger.info(
        "Agenda '%s' (%s) categorized as '%s'",
        body.agenda_subject,
        body.agenda_id,
        category,
    )

    result = FeedbackResult(
        category=category,
        category_reason=reason,
        feedback=feedback,
        spans=spans,
    )

    # Only persist when LLM processing succeeded.
    if not failed:
        try:
            await insert_ai_feedback(
                agenda_id=body.agenda_id,
                input_payload=body.model_dump(),
                output_payload=result.model_dump(),
            )
        except Exception as exc:  # pragma: no cover - best-effort logging
            logger.exception(
                "Failed to insert ai_feedback for agenda_id=%s: %s",
                body.agenda_id,
                exc,
            )

    return result


@app.post("/speech-to-text", response_model=SpeechToTextResponse)
async def speech_to_text(body: SpeechToTextRequest) -> SpeechToTextResponse:
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
async def translate(body: TranslateRequest) -> TranslateResponse:
    """
    Translate meeting minutes text between English (en) and Kannada (kn).
    Uses the LLM to preserve proper nouns and official document style.
    """
    translation = await translate_text(body.text, body.from_locale, body.to_locale)
    return TranslateResponse(translation=translation)


# If you want to run with: `python -m gram_panchayat_api.main`
if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run("gram_panchayat_api.main:app", host="0.0.0.0", port=8000, reload=True)

