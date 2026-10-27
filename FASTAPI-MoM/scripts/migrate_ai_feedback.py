"""
Create / upgrade the audit tables (ai_feedback, stt_sessions).

The backend applies the same idempotent DDL on every startup, so this script is
only needed when you want to prepare a database without starting the API.

Usage:
    DATABASE_URL=postgresql://user:pass@host:5432/db python scripts/migrate_ai_feedback.py
"""

import asyncio
import os
import sys

from dotenv import load_dotenv

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from gram_panchayat_api.db import _SCHEMA  # noqa: E402

import asyncpg  # noqa: E402


async def main() -> None:
    load_dotenv()
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        raise SystemExit("DATABASE_URL is not set")
    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(_SCHEMA)
        tables = await conn.fetch(
            "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1"
        )
        print("Schema applied. Tables:", ", ".join(r["table_name"] for r in tables))
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
