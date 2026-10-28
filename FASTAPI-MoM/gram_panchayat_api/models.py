from typing import List, Literal, Optional

from pydantic import BaseModel, field_validator


class FeedbackRequest(BaseModel):
    agenda_id: str
    agenda_subject: str
    mom_discussion: str
    feedback_language: Literal["en", "kn"] = "en"

    @field_validator("agenda_id", "agenda_subject", "mom_discussion")
    @classmethod
    def must_not_be_empty(cls, value: str) -> str:
        if value is None:
            raise ValueError("must not be null")
        if not value.strip():
            raise ValueError("must not be empty or whitespace")
        return value


class FeedbackItem(BaseModel):
    """One feedback point. `highlight` is a verbatim substring of `text` (or null)."""

    text: str
    highlight: Optional[str] = None


class FeedbackResult(BaseModel):
    """
    Client-facing feedback contract.

    `status` is "feedback" when there are points to act on and "good_to_go" when
    the minutes are complete (or the previous round's feedback was addressed).
    Classification (category / reason) is recorded in the audit table only.
    """

    status: Literal["feedback", "good_to_go"]
    message: Optional[str] = None
    feedback: List[FeedbackItem] = []
    rewrite: Optional[str] = None
    round: int = 1


class SpeechToTextRequest(BaseModel):
    audioDataUri: str
    locale: Literal["en", "kn"]

    @field_validator("audioDataUri")
    @classmethod
    def audio_must_not_be_empty(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("audioDataUri must not be empty")
        if "," not in value:
            raise ValueError("audioDataUri must be a valid data URI")
        return value


class SpeechToTextResponse(BaseModel):
    transcription: str


class TranslateRequest(BaseModel):
    text: str
    from_locale: Literal["en", "kn"]
    to_locale: Literal["en", "kn"]

    @field_validator("text")
    @classmethod
    def text_must_not_be_empty(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("text must not be empty or whitespace")
        return value


class TranslateResponse(BaseModel):
    translation: str


class OCRRequest(BaseModel):
    image: str  # base64-encoded image bytes
    format: str  # "image/jpeg" or "image/png"

    @field_validator("image")
    @classmethod
    def image_must_not_be_empty(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("image must not be empty")
        return value

    @field_validator("format")
    @classmethod
    def format_must_be_valid(cls, value: str) -> str:
        if value not in ["image/jpeg", "image/png"]:
            raise ValueError("format must be 'image/jpeg' or 'image/png'")
        return value


class OCRResponse(BaseModel):
    extracted_text: str
    detected_language: Literal["en", "kn"]
    confidence: float
    error: Optional[str] = None
