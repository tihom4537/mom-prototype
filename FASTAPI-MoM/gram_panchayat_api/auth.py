"""
JWT bearer authentication for the protected endpoints.

This service is a *verify-only* resource server: it never issues or signs tokens.
The caller (the vendor's backend) signs a JWT with its private key and sends it as
``Authorization: Bearer <token>``. This service verifies the signature and expiry
using a key it holds in configuration, and rejects anything invalid with 401.

Two algorithms are supported via the ``JWT_ALGORITHM`` env var:

- ``RS256`` (default, recommended): asymmetric. Configure ``JWT_PUBLIC_KEY`` (PEM)
  or ``JWT_PUBLIC_KEY_PATH`` with the caller's *public* key. The private key never
  touches this service, so compromising it cannot be used to forge tokens.
- ``HS256``: symmetric. Configure ``JWT_SECRET`` with the shared secret. Simpler,
  but both sides hold the same signing secret.

Optional extra checks: set ``JWT_ISSUER`` and/or ``JWT_AUDIENCE`` to also validate
the ``iss`` / ``aud`` claims.
"""

import logging
import os

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer


logger = logging.getLogger(__name__)

# auto_error=False so a *missing* Authorization header reaches our code as None,
# letting us return 401 (correct for "no credentials") instead of FastAPI's default 403.
_bearer_scheme = HTTPBearer(auto_error=False)


def _algorithm() -> str:
    return os.getenv("JWT_ALGORITHM", "RS256").upper()


def _verification_key() -> str:
    """Return the key used to verify a token, based on the configured algorithm."""
    algo = _algorithm()

    if algo.startswith("HS"):  # symmetric: shared secret
        secret = os.getenv("JWT_SECRET")
        if not secret:
            raise RuntimeError("JWT_SECRET is not set; cannot verify HS* tokens.")
        return secret

    # asymmetric (RS*/ES*/PS*/EdDSA): public key, inline or from a file
    inline = os.getenv("JWT_PUBLIC_KEY")
    if inline:
        # Allow keys passed as a single line with literal "\n" (common in env vars).
        return inline.replace("\\n", "\n")

    path = os.getenv("JWT_PUBLIC_KEY_PATH")
    if path and os.path.exists(path):
        with open(path, "r", encoding="utf-8") as handle:
            return handle.read()

    raise RuntimeError(
        "No JWT public key configured. Set JWT_PUBLIC_KEY or JWT_PUBLIC_KEY_PATH."
    )


def decode_token(token: str) -> dict:
    """
    Verify a JWT and return its claims.

    Raises ``jwt.InvalidTokenError`` (incl. ``ExpiredSignatureError``) for a bad
    token and ``RuntimeError`` if verification is misconfigured. Shared by the
    HTTP dependency below and the WebSocket endpoint, which cannot use it.
    """
    issuer = os.getenv("JWT_ISSUER") or None
    audience = os.getenv("JWT_AUDIENCE") or None

    return jwt.decode(
        token,
        _verification_key(),
        algorithms=[_algorithm()],
        audience=audience,
        issuer=issuer,
        options={
            "verify_aud": audience is not None,
            "verify_iss": issuer is not None,
        },
    )


async def require_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> dict:
    """
    FastAPI dependency that verifies the bearer token and returns its claims.

    Raises 401 when no credentials are supplied, on an expired or otherwise invalid
    token, or if verification is misconfigured. Attach with ``Depends(require_auth)``.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        claims = decode_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except RuntimeError as exc:
        # Misconfiguration (no key/secret) — log it, but don't leak details.
        logger.error("JWT verification misconfigured: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is not configured correctly",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return claims
