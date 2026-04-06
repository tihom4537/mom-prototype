# Integration Guide — ICT Infracon Team

This document covers everything needed to deploy and integrate the Gram Panchayat Meeting Feedback API into your existing application.

The service exposes two REST endpoints:
- **`POST /feedback`** — AI-generated categorization and feedback for meeting agenda items.
- **`POST /speech-to-text`** — Audio transcription using Sarvam AI.

---

## Environment Variables

All configuration is passed via environment variables. A template is provided in `.env.example`.

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `SARVAMAI_API_KEY` | Yes | Sarvam AI API key |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `LLM_MODEL_NAME` | No | Override default LLM model (default: `gemini-3.1-flash-lite-preview`) |

**`DATABASE_URL` format:**
```
postgresql://user:password@host:5432/dbname
```
For cloud-hosted databases (RDS, Cloud SQL, etc.), append `?sslmode=require`:
```
postgresql://user:password@host:5432/dbname?sslmode=require
```

---

## API Reference

### `GET /health`

Health check. Use this to verify the service is running.

**Response (200)**:
```json
{ "status": "ok" }
```

---

### `POST /feedback`

Classifies a meeting agenda item into a category and returns actionable feedback to improve the minutes.

**Request** (`application/json`):
```json
{
  "agenda_id": "string (required, non-empty)",
  "agenda_subject": "string (required, non-empty)",
  "mom_discussion": "string (required, non-empty)"
}
```

| Field | Type | Description |
|---|---|---|
| `agenda_id` | string | Unique identifier for the agenda item |
| `agenda_subject` | string | Title or subject of the agenda item |
| `mom_discussion` | string | The minutes of meeting discussion text |

**Response (200)**:
```json
{
  "category": "string",
  "category_reason": "string",
  "feedback": ["string"]
}
```

| Field | Type | Description |
|---|---|---|
| `category` | string | Classified category of the agenda item |
| `category_reason` | string | Explanation for the assigned category |
| `feedback` | array of strings | Each element is a separate, actionable improvement point |

> `feedback` is a **JSON array** — not a comma-separated string. Each element is an independent feedback point.

**Example request**:
```bash
curl -X POST "https://<your-host>/feedback" \
  -H "Content-Type: application/json" \
  -d '{
        "agenda_id": "AG-001",
        "agenda_subject": "Road repair in Ward 5",
        "mom_discussion": "Members discussed potholes on the main street and resolved to prepare an estimate and submit a proposal to the district office."
      }'
```

**Example response**:
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

**Errors**:
| Status | Condition |
|---|---|
| `422 Unprocessable Entity` | Any field is missing, empty, or whitespace |
| `500 Internal Server Error` | LLM call failed (check `GEMINI_API_KEY` and network access to Gemini) |

---

### `POST /speech-to-text`

Transcribes a short audio recording provided as a Base64-encoded data URI.

**Request** (`application/json`):
```json
{
  "audioDataUri": "data:<mimetype>;base64,<encoded_audio>",
  "locale": "en | kn"
}
```

| Field | Type | Description |
|---|---|---|
| `audioDataUri` | string | Full data URI with Base64-encoded audio (e.g. `data:audio/webm;base64,...`) |
| `locale` | string | Language of the audio — must be `"en"` or `"kn"` |

**Supported locales**:

| Value | Language |
|-------|----------|
| `en`  | English (India) |
| `kn`  | Kannada |

**Response (200)**:
```json
{
  "transcription": "string"
}
```

**Example request**:
```bash
curl -X POST "https://<your-host>/speech-to-text" \
  -H "Content-Type: application/json" \
  -d '{
        "audioDataUri": "data:audio/webm;base64,<your_base64_audio>",
        "locale": "en"
      }'
```

**Errors**:
| Status | Condition |
|---|---|
| `422 Unprocessable Entity` | `audioDataUri` is empty or not a valid data URI, or `locale` is not `"en"` / `"kn"` |
| `500 Internal Server Error` | Sarvam API call failed (check `SARVAMAI_API_KEY` and network access) |

---

## Quick Start for Local Testing

The fastest way to test the full stack locally — no external database required.

**Prerequisites**: Docker and Docker Compose installed.

1. **Copy and fill in your API keys**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set `GEMINI_API_KEY` and `SARVAMAI_API_KEY`.
   Leave `DATABASE_URL` unset — the test setup provisions its own Postgres.

2. **Start all services**

   ```bash
   docker-compose -f docker-compose.test.yml up --build
   ```

   This will automatically:
   - Start a local PostgreSQL 15 instance
   - Run the database migration (creates the `ai_feedback` table)
   - Start the API at `http://localhost:8000`

3. **Verify the service is up**

   ```bash
   curl http://localhost:8000/health
   # Expected: {"status":"ok"}
   ```

4. **Test feedback**

   ```bash
   curl -X POST http://localhost:8000/feedback \
     -H "Content-Type: application/json" \
     -d '{
           "agenda_id": "AG-001",
           "agenda_subject": "Road repair in Ward 5",
           "mom_discussion": "Members discussed potholes on the main street and resolved to prepare an estimate and submit a proposal to the district office."
         }'
   ```

5. **Tear down**

   ```bash
   docker-compose -f docker-compose.test.yml down -v
   ```

---

## Production Deployment

### Prerequisites

- Docker
- An externally provisioned PostgreSQL database
- `GEMINI_API_KEY`, `SARVAMAI_API_KEY`, and `DATABASE_URL` available as environment variables

### Step 1 — Run the database migration

This is a one-time step that creates the `ai_feedback` table in your database.

```bash
docker run --rm \
  -e DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require" \
  mom-ai-feedback-api \
  python scripts/migrate_ai_feedback.py
```

The table created:
```sql
CREATE TABLE IF NOT EXISTS ai_feedback (
    id         SERIAL      PRIMARY KEY,
    agenda_id  TEXT        NOT NULL,
    input      JSONB       NOT NULL,   -- full request payload
    output     JSONB       NOT NULL,   -- full response payload
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

> This table is an audit log — every successful `/feedback` call is recorded here with the full request and response. The `JSONB` columns allow querying by category, agenda ID, or any other field if needed later.

### Step 2 — Start the service

With Nginx reverse proxy (exposes port **80**):

```bash
export GEMINI_API_KEY="your_gemini_key"
export SARVAMAI_API_KEY="your_sarvam_key"
export DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

docker-compose up --build
```

Without Nginx (exposes port **8000** directly):

```bash
docker run -p 8000:8000 \
  -e GEMINI_API_KEY="your_gemini_key" \
  -e SARVAMAI_API_KEY="your_sarvam_key" \
  -e DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require" \
  mom-ai-feedback-api
```

### Infrastructure Notes

- **Single image**: one container runs both the feedback and speech-to-text APIs.
- **External services**: Gemini and Sarvam are external HTTP APIs — no additional containers needed.
- **Database**: the service connects to your existing PostgreSQL instance. It does not manage or own the database.
- **Secrets**: pass all keys via environment variables. Do not commit `.env` files with real keys.
- **DATABASE_URL optional**: if `DATABASE_URL` is not set, the API still works but feedback calls will not be persisted (a warning is logged).

---

## Design Screens

<!-- To be added -->
