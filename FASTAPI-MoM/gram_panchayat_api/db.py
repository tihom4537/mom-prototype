import json
import logging
import os
from typing import Any, Dict, Optional

import asyncpg


logger = logging.getLogger(__name__)

_POOL: Optional[asyncpg.Pool] = None


async def init_db_pool() -> None:
    """
    Initialize a global asyncpg connection pool.

    If DATABASE_URL is not set, DB operations are effectively disabled but
    the application keeps working (it just logs a warning).
    """
    global _POOL
    if _POOL is not None:
        return

    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        logger.warning(
            "DATABASE_URL is not set; ai_feedback records will not be persisted."
        )
        return

    try:
        _POOL = await asyncpg.create_pool(dsn, min_size=1, max_size=5)
        logger.info("PostgreSQL connection pool initialised.")
    except Exception as exc:
        logger.warning(
            "Could not connect to database: %s — ai_feedback records will not be persisted.", exc
        )


async def close_db_pool() -> None:
    """Close the global asyncpg pool."""
    global _POOL
    if _POOL is not None:
        await _POOL.close()
        _POOL = None
        logger.info("PostgreSQL connection pool closed.")


async def insert_ai_feedback(
    agenda_id: str,
    input_payload: Dict[str, Any],
    output_payload: Dict[str, Any],
) -> None:
    """
    Persist an AI feedback call into the ai_feedback table.

    Expected table definition (recommended):
        CREATE TABLE ai_feedback (
            id SERIAL PRIMARY KEY,
            agenda_id TEXT NOT NULL,
            input JSONB NOT NULL,
            output JSONB NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    """
    if _POOL is None:
        logger.warning(
            "DB pool not initialised; skipping insert into ai_feedback for agenda_id=%s",
            agenda_id,
        )
        return

    input_json = json.dumps(input_payload, ensure_ascii=False)
    output_json = json.dumps(output_payload, ensure_ascii=False)

    async with _POOL.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO ai_feedback (agenda_id, input, output)
            VALUES ($1, $2::jsonb, $3::jsonb)
            """,
            agenda_id,
            input_json,
            output_json,
        )

