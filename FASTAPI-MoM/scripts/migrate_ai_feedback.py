import asyncio
import os

import asyncpg
from dotenv import load_dotenv


DDL = """
CREATE TABLE IF NOT EXISTS ai_feedback (
    id SERIAL PRIMARY KEY,
    agenda_id TEXT NOT NULL,
    input JSONB NOT NULL,
    output JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""


async def main() -> None:
    # Load env so DATABASE_URL works similarly to the app.
    load_dotenv()
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        raise RuntimeError("DATABASE_URL is not set in environment.")

    conn = await asyncpg.connect(dsn)
    try:
        await conn.execute(DDL)
        print("ai_feedback table created or already exists.")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())

