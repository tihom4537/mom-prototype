"""
Optional PostgreSQL persistence (asyncpg).

If DATABASE_URL is unset or the database is unreachable the API keeps working;
audit rows are simply not written and a warning is logged. The schema is
created / upgraded at startup (idempotent DDL), so no separate migration step
is needed for a fresh database.

Tables
------
ai_feedback   one row per /feedback call (request, response, classification, round)
stt_sessions  one row per live transcription session (final transcript, no audio)
"""

import json
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

import asyncpg


logger = logging.getLogger(__name__)

_POOL: Optional[asyncpg.Pool] = None

_SCHEMA = """
CREATE TABLE IF NOT EXISTS ai_feedback (
    id          BIGSERIAL PRIMARY KEY,
    agenda_id   TEXT NOT NULL,
    input       JSONB NOT NULL,
    output      JSONB NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE ai_feedback
    ADD COLUMN IF NOT EXISTS category         TEXT,
    ADD COLUMN IF NOT EXISTS category_reason  TEXT,
    ADD COLUMN IF NOT EXISTS status           TEXT,
    ADD COLUMN IF NOT EXISTS round            INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS model            TEXT,
    ADD COLUMN IF NOT EXISTS latency_ms       INTEGER;
CREATE INDEX IF NOT EXISTS ai_feedback_agenda_created_idx
    ON ai_feedback (agenda_id, created_at DESC);

CREATE TABLE IF NOT EXISTS stt_sessions (
    id                BIGSERIAL PRIMARY KEY,
    request_id        TEXT,
    agenda_id         TEXT,
    locale            TEXT NOT NULL,
    model             TEXT NOT NULL,
    transcript        TEXT NOT NULL DEFAULT '',
    utterances        JSONB NOT NULL DEFAULT '[]'::jsonb,
    audio_duration_s  NUMERIC(8,2),
    total_utterances  INTEGER,
    outcome           TEXT NOT NULL,
    error_code        TEXT,
    started_at        TIMESTAMPTZ NOT NULL,
    ended_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS stt_sessions_started_idx ON stt_sessions (started_at DESC);
CREATE INDEX IF NOT EXISTS stt_sessions_agenda_idx ON stt_sessions (agenda_id);
"""


def db_enabled() -> bool:
    return _POOL is not None


async def init_db_pool() -> None:
    """Create the pool and apply the idempotent schema. Safe to call when DATABASE_URL is unset."""
    global _POOL
    if _POOL is not None:
        return

    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        logger.warning("DATABASE_URL is not set; feedback and STT audit rows will not be persisted.")
        return

    try:
        _POOL = await asyncpg.create_pool(dsn, min_size=1, max_size=5, command_timeout=30)
        async with _POOL.acquire() as conn:
            await conn.execute(_SCHEMA)
        logger.info("PostgreSQL connection pool initialised and schema verified.")
    except Exception as exc:
        logger.warning("Could not connect to database: %s — audit rows will not be persisted.", exc)
        _POOL = None


async def close_db_pool() -> None:
    global _POOL
    if _POOL is not None:
        await _POOL.close()
        _POOL = None
        logger.info("PostgreSQL connection pool closed.")


# ── ai_feedback ─────────────────────────────────────────────────────────────


async def fetch_last_feedback(agenda_id: str) -> Optional[Dict[str, Any]]:
    """
    Latest feedback row for an agenda item, or None.

    Returns {"status", "round", "feedback": [point texts], "created_at"}.
    """
    if _POOL is None:
        return None
    async with _POOL.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT status, round, output, created_at
            FROM ai_feedback
            WHERE agenda_id = $1
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """,
            agenda_id,
        )
    if row is None:
        return None
    output = row["output"]
    if isinstance(output, str):
        output = json.loads(output)
    points = [item.get("text", "") for item in (output.get("feedback") or []) if isinstance(item, dict)]
    return {
        "status": row["status"] or output.get("status"),
        "round": row["round"] or 1,
        "feedback": [p for p in points if p],
        "created_at": row["created_at"],
    }


async def insert_ai_feedback(
    agenda_id: str,
    input_payload: Dict[str, Any],
    output_payload: Dict[str, Any],
    *,
    category: str,
    category_reason: str,
    status: str,
    round_no: int,
    model: str,
    latency_ms: int,
) -> None:
    """Append one audit row. No-op (with a warning) when the DB is not configured."""
    if _POOL is None:
        logger.warning("DB pool not initialised; skipping ai_feedback insert for agenda_id=%s", agenda_id)
        return
    async with _POOL.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO ai_feedback
                (agenda_id, input, output, category, category_reason, status, round, model, latency_ms)
            VALUES ($1, $2::jsonb, $3::jsonb, $4, $5, $6, $7, $8, $9)
            """,
            agenda_id,
            json.dumps(input_payload, ensure_ascii=False),
            json.dumps(output_payload, ensure_ascii=False),
            category,
            category_reason,
            status,
            round_no,
            model,
            latency_ms,
        )


# ── stt_sessions ────────────────────────────────────────────────────────────


async def insert_stt_session(
    *,
    request_id: Optional[str],
    agenda_id: Optional[str],
    locale: str,
    model: str,
    utterances: List[Dict[str, Any]],
    audio_duration_s: Optional[float],
    total_utterances: Optional[int],
    outcome: str,
    error_code: Optional[str],
    started_at: datetime,
) -> None:
    """Record one finished live-transcription session (final text only, never audio)."""
    if _POOL is None:
        return
    transcript = " ".join(u.get("text", "").strip() for u in utterances if u.get("text", "").strip())
    async with _POOL.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO stt_sessions
                (request_id, agenda_id, locale, model, transcript, utterances,
                 audio_duration_s, total_utterances, outcome, error_code, started_at)
            VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11)
            """,
            request_id,
            agenda_id,
            locale,
            model,
            transcript,
            json.dumps(utterances, ensure_ascii=False),
            audio_duration_s,
            total_utterances,
            outcome,
            error_code,
            started_at,
        )
