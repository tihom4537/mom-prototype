# Gram Panchayat Meeting Feedback API

FastAPI application that uses an LLM to:

- Classify Gram Panchayat meeting agenda items into predefined categories.
- Generate structured, constructive feedback to improve the quality of meeting minutes.


## Tech Stack

- **Python**: 3.11+
- **FastAPI**
- **Pydantic v2**
- **httpx** (async HTTP client)
- **python-dotenv**
- **Gemini Flash Lite Preview** as the default LLM (`gemini-3.1-flash-lite-preview`)

## Setup

1. **Install dependencies**

   ```bash
   # From the project root
   pip install -r requirements.txt
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` at the project root and fill in your keys:

   ```bash
   cp .env.example .env
   ```

   Required variables:

   ```bash
   GEMINI_API_KEY=your_gemini_key_here
   SARVAMAI_API_KEY=your_sarvam_key_here
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   # Optional: override LLM model
   # LLM_MODEL_NAME=gemini-3.1-flash-lite-preview
   ```

3. **Run the server (local dev)**

   ```bash
   uvicorn gram_panchayat_api.main:app --reload
   ```

   The app will be available at `http://localhost:8000`.

## Endpoints

### `GET /health`

- **Description**: health check endpoint.
- **Response (200)**:

```json
{ "status": "ok" }
```

### `POST /feedback`

- **Description**: categorizes one agenda item and generates improvement feedback for the minutes (single LLM call; prompt is experimental and may evolve).
- **Request (application/json)**:

```json
{
  "agenda_id": "string (required, non-empty)",
  "agenda_subject": "string (required, non-empty)",
  "mom_discussion": "string (required, non-empty)"
}
```

- **Response (200)**:

```json
{
  "category": "string",
  "category_reason": "string",
  "feedback": ["string"]
}
```

  > `feedback` is a **JSON array of strings** — each element is a separate, actionable feedback point (not a comma-separated value). The array may contain one or more items.

- **Example**:

```json
{
  "category": "Infrastructure",
  "category_reason": "The agenda item pertains to physical infrastructure development in the ward.",
  "feedback": [
    "Specify a concrete timeline for submitting the estimate to the district office.",
    "Document the names of members assigned to prepare the estimate.",
    "Include the estimated cost range if discussed during the meeting."
  ]
}
```

- **Validation**:
  - Returns **422 Unprocessable Entity** if any required string is empty or whitespace.

### `POST /speech-to-text`

- **Description**: transcribes a short Base64 audio data URI using Sarvam Speech-to-Text.
- **Request (application/json)**:

```json
{
  "audioDataUri": "data:<mimetype>;base64,<encoded_audio>",
  "locale": "en | kn"
}
```

- **Supported locales**:

  | Value | Language |
  |-------|----------|
  | `en`  | English (India) |
  | `kn`  | Kannada |

  > Only `"en"` and `"kn"` are accepted. Any other value returns **422 Unprocessable Entity**.

- **Response (200)**:

```json
{
  "transcription": "string"
}
```

## Deployment

### Images from GitHub Actions (CI/CD)

On every **push to `main`** and on **version tags** (`v*`), GitHub Actions builds the Docker image and pushes it to **GitHub Container Registry (ghcr.io)**.

- **Image**: `ghcr.io/<org>/<repo>:main` (or `:v1.0.0` when you tag).
- **Workflow**: `.github/workflows/build-image.yml`.

To run the published image (after logging in to GHCR if the repo is private):

```bash
docker run -p 8000:8000 \
  -e GEMINI_API_KEY="..." \
  -e SARVAMAI_API_KEY="..." \
  -e DATABASE_URL="..." \
  ghcr.io/<org>/<repo>:main
```

Replace `<org>/<repo>` with your GitHub org and repo name (e.g. `myorg/mom-ai-feedback-api`).

### With Docker (local build)

- **Build the image**

  ```bash
  docker build -t mom-ai-feedback-api .
  ```

- **Run DB migration (creates `ai_feedback` table)**

  ```bash
  docker run --rm \
    -e DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require" \
    mom-ai-feedback-api \
    python scripts/migrate_ai_feedback.py
  ```

- **Run the API**

  ```bash
  docker run -p 8000:8000 \
    -e GEMINI_API_KEY="your_gemini_key" \
    -e SARVAMAI_API_KEY="your_sarvam_key" \
    -e DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require" \
    mom-ai-feedback-api
  ```

### With Docker + Nginx (reverse proxy)

This setup runs:
- the FastAPI app as `api` and
- an Nginx reverse proxy as `nginx`, exposing port **80**.

1. **Set environment variables** (for local use via `docker-compose`):

   ```bash
   export GEMINI_API_KEY="your_gemini_key"
   export SARVAMAI_API_KEY="your_sarvam_key"
   export DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
   # Optional:
   # export LLM_MODEL_NAME="gemini-3.1-flash-lite-preview"
   ```

2. **Build and start services**

   ```bash
   docker-compose up --build
   ```

3. **Call the API through Nginx**

   - Feedback:

     ```bash
     curl -X POST "http://localhost/feedback" \
       -H "Content-Type: application/json" \
       -d '{
             "agenda_id": "AG-001",
             "agenda_subject": "Road repair in Ward 5",
             "mom_discussion": "Members discussed potholes on the main street and resolved to prepare an estimate and submit a proposal to the district office."
           }'
     ```

   - Speech-to-text:

     ```bash
     curl -X POST "http://localhost/speech-to-text" \
       -H "Content-Type: application/json" \
       -d '{
             "audioDataUri": "data:audio/webm;base64,<encoded_audio>",
             "locale": "en"
           }'
     ```


### Production notes for ICT infracon engineers

- **Single service image**: this repo builds one image containing the FastAPI app (feedback + speech-to-text).
- **External services**:
  - Gemini and Sarvam are external HTTP APIs; no extra containers are needed.
  - PostgreSQL is expected to be provided by your infrastructure (e.g. RDS, Cloud SQL, in-cluster Postgres).
- **Configuration**:
  - All secrets and URLs are passed via environment variables (`GEMINI_API_KEY`, `SARVAMAI_API_KEY`, `DATABASE_URL`, optional `LLM_MODEL_NAME`).
  - `.env.example` shows the required variables; do not commit real keys.
  - All fields are mandatory and must not be empty or whitespace; otherwise FastAPI returns `422 Unprocessable Entity`.


## LLM Model Flexibility

- The LLM client is implemented in `llm_client.py`.
- By default it calls Gemini Flash Lite Preview (`gemini-3.1-flash-lite-preview`) via:

  `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}`

- To switch models within the Gemini family, change `LLM_MODEL_NAME` in `.env`
  or pass a different `model` parameter when calling `generate_text`.

The code is structured so that, if you later integrate a non-Gemini provider,
you can adapt `generate_text` in `llm_client.py` while keeping the rest of the
application unchanged.

## Architecture (for teammates)

- **FastAPI app** (`main.py`): owns the HTTP endpoints (`/health`, `/feedback`, `/speech-to-text`), wiring together Pydantic models, LLM pipeline, and database persistence.
- **Data models** (`models.py`): define request/response schemas for both APIs, including validation (e.g. non-empty strings, valid data URIs).
- **Feedback pipeline** (`feedback.py`, `prompts.py`, `llm_client.py`, `json_utils.py`):
  - Builds a single prompt that both classifies an agenda item and generates feedback.
  - Calls Gemini via REST with retries and env-driven model selection.
  - Parses the JSON-like LLM response safely and normalizes feedback bullets.
- **Speech-to-text pipeline** (`speech_to_text.py`): calls Sarvam AI's REST API with a Base64 audio data URI and returns a plain transcription.
- **Persistence layer** (`db.py`, `scripts/migrate_ai_feedback.py`):
  - Manages an asyncpg connection pool using `DATABASE_URL`.
  - Inserts each successful `/feedback` call into the `ai_feedback` table as JSONB input/output.
  - Provides a simple migration script to create the `ai_feedback` table.
  - Table schema:

    ```sql
    CREATE TABLE IF NOT EXISTS ai_feedback (
        id         SERIAL      PRIMARY KEY,
        agenda_id  TEXT        NOT NULL,
        input      JSONB       NOT NULL,  -- full request payload
        output     JSONB       NOT NULL,  -- full response payload
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ```

  - Run migration: `python scripts/migrate_ai_feedback.py` (requires `DATABASE_URL` in env).

## Low-level Design (Sequence Diagrams)

### Feedback API (`POST /feedback`)

```mermaid
sequenceDiagram
    autonumber
    participant C as Client<br/>(curl / frontend)
    participant R as FastAPI Router<br/>main.get_feedback()
    participant M as Pydantic v2<br/>FeedbackRequest / FeedbackResult
    participant FB as feedback.py<br/>get_feedback()
    participant PR as prompts.py<br/>build_single_call_prompt()
    participant L as llm_client.py<br/>generate_text()
    participant G as Gemini REST API<br/>generateContent

    C->>R: POST /feedback<br/>{ agenda_id, agenda_subject, mom_discussion }
    R->>M: Parse + validate body<br/>FeedbackRequest(...)
    M-->>R: Validated FeedbackRequest (body)
    R->>FB: await get_feedback(body.agenda_subject, body.mom_discussion)
    FB->>PR: build_single_call_prompt(agenda_subject, mom_discussion)
    PR-->>FB: prompt (string)
    FB->>L: await generate_text(prompt,<br/>response_mime_type="application/json")
    L->>L: _load_env() → read GEMINI_API_KEY, LLM_MODEL_NAME
    L->>G: HTTP POST /v1beta/models/{model}:generateContent?key=...
    G-->>L: JSON response (candidates[0].content.parts[0].text)
    L-->>FB: raw_text (LLM output)
    FB->>FB: parse_first_json_object(raw_text)<br/>(extract JSON object)
    FB->>FB: category, reason, feedback_raw = data[...]
    FB->>FB: feedback = parse_bulleted_feedback(feedback_raw)
    FB-->>R: (category, reason, feedback, feedback_raw, failed)
    R->>R: logger.info(... agenda_id, category ...)
    R->>M: Build FeedbackResult(category, category_reason, feedback)
    M-->>R: Response model instance
    R-->>C: 200 OK<br/>{ category, category_reason, feedback }
```

### Speech-to-Text API (`POST /speech-to-text`)

```mermaid
sequenceDiagram
    autonumber
    participant C as Client<br/>(frontend / caller)
    participant R as FastAPI Router<br/>main.speech_to_text()
    participant M as Pydantic v2<br/>SpeechToTextRequest / Response
    participant ST as speech_to_text.py<br/>transcribe_audio_data_uri()
    participant S as Sarvam REST API<br/>/speech-to-text

    C->>R: POST /speech-to-text<br/>{ audioDataUri, locale }
    R->>M: Parse + validate body<br/>SpeechToTextRequest(...)
    M-->>R: Validated SpeechToTextRequest (body)
    R->>ST: await transcribe_audio_data_uri(body.audioDataUri, body.locale)
    ST->>ST: Split data URI, decode Base64 → bytes
    ST->>S: HTTP POST https://api.sarvam.ai/speech-to-text<br/>multipart/form-data (model, mode, language_code, file)
    S-->>ST: JSON response<br/>{ transcript, language_code, ... }
    ST-->>R: transcription string
    R->>M: Build SpeechToTextResponse(transcription)
    M-->>R: Response model instance
    R-->>C: 200 OK<br/>{ transcription }
```
