from typing import List, Literal, Optional, Union

from pydantic import BaseModel, Field, field_validator


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


# ---------------------------------------------------------------------------
# Live speech-to-text WebSocket events (server -> client).
#
# This is the public contract for `WS /ws/speech-to-text`. The relay maps the
# provider's own event names/fields onto these models, so swapping the STT
# model or provider must never change what the client receives. Changing any
# field here breaks tests/contracts/stt_events.schema.json on purpose.
# ---------------------------------------------------------------------------


class SttReadyEvent(BaseModel):
    """Session open; `request_id` identifies the session in the audit table."""

    type: Literal["ready"] = "ready"
    request_id: Optional[str] = None


class SttPartialEvent(BaseModel):
    """Interim text for the utterance currently being spoken."""

    type: Literal["partial"] = "partial"
    utterance: int
    text: str


class SttFinalEvent(BaseModel):
    """Final text for one utterance (after a pause)."""

    type: Literal["final"] = "final"
    utterance: int
    text: str


class SttErrorEvent(BaseModel):
    """
    Something went wrong. `fatal` true means the server will close the socket.

    Codes the server itself emits: unauthorized, invalid_start, server_misconfigured,
    provider_unavailable, provider_failed. Non-fatal provider codes (for example
    chunk_too_large) are passed through verbatim.
    """

    type: Literal["error"] = "error"
    code: str
    message: str
    fatal: bool


class SttEndEvent(BaseModel):
    """Session finished after the client's `{"type": "end"}` frame was flushed."""

    type: Literal["end"] = "end"
    audio_duration_s: Optional[float] = None
    total_utterances: Optional[int] = None


SttEvent = Union[SttReadyEvent, SttPartialEvent, SttFinalEvent, SttErrorEvent, SttEndEvent]


# ---------------------------------------------------------------------------
# Agenda categorisation and the proceedings notesheet PDF.
# ---------------------------------------------------------------------------

AgendaCategory = Literal[
    "Issue / Grievance",
    "Review / Status",
    "Planning / Preparatory",
    "Information / Intimation",
    "Multi-Topic / Miscellaneous",
    "Other / Can't Categorize",
]

class AgendaInput(BaseModel):
    """
    One user-added agenda item as the caller holds it. The nine statutory
    agendas are never sent: the server always prints their fixed sheets first.
    """

    id: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=500)
    description: str = Field(default="", max_length=5000)

    @field_validator("id", "title")
    @classmethod
    def must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be empty or whitespace")
        return value.strip()


class CategoriseRequest(BaseModel):
    agendas: List[AgendaInput] = Field(min_length=1, max_length=50)


class ColumnDef(BaseModel):
    key: str
    label_kn: str
    label_en: str
    width_pct: int
    kind: Literal["serial", "text", "yes_no", "final_or_approval"]


class CategorisedAgenda(BaseModel):
    id: str
    category: AgendaCategory
    columns: List[ColumnDef]


class CategoriseResponse(BaseModel):
    agendas: List[CategorisedAgenda]


class CategorySheetDef(BaseModel):
    category: AgendaCategory
    title_kn: str
    title_en: str
    columns: List[ColumnDef]


class CategoryCatalogueResponse(BaseModel):
    categories: List[CategorySheetDef]


class MeetingInput(BaseModel):
    title: str = Field(min_length=1, max_length=300)
    date: str = Field(default="", max_length=50)
    time: str = Field(default="", max_length=50)
    venue: str = Field(default="", max_length=200)


class ProceedingsPdfRequest(BaseModel):
    """
    Everything needed to print the notesheet: the meeting header plus the
    user-added agendas in the order they should appear after the nine
    statutory sheets. Each is classified and printed on its category sheet.
    """

    meeting: MeetingInput
    agendas: List[AgendaInput] = Field(default_factory=list, max_length=60)
    orientation: Literal["landscape", "portrait"] = "landscape"
