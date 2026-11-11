"""
Contract tests run without network, database or real API keys.

The LLM call and the Sarvam relay are replaced with fakes, so what is tested is
exactly the part we promise integrators: the request and response shapes.
"""
import os
import sys
from pathlib import Path

import jwt
import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

# Symmetric signing keeps the tests self-contained; the verifier code path is
# the same one that checks RS256 in production.
os.environ.update(
    JWT_ALGORITHM="HS256",
    JWT_SECRET="contract-test-secret-contract-test-secret-0123456789",
    JWT_AUDIENCE="mom-api",
    GEMINI_API_KEY="unused-in-tests",
    SARVAMAI_API_KEY="unused-in-tests",
)
os.environ.pop("DATABASE_URL", None)


@pytest.fixture(scope="session")
def token() -> str:
    import time
    now = int(time.time())
    return jwt.encode(
        {"sub": "contract-tests", "aud": "mom-api", "iat": now, "exp": now + 300},
        os.environ["JWT_SECRET"],
        algorithm="HS256",
    )


@pytest.fixture()
def client():
    from fastapi.testclient import TestClient
    from gram_panchayat_api.main import app

    with TestClient(app) as c:
        yield c
