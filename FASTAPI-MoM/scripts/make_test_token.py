"""
Mint a short-lived test JWT so you can exercise the protected endpoints.

This stands in for the vendor's backend (the token SIGNER). In production the
vendor signs their own tokens with their private key; this script just lets you
test the microservice's verification locally.

Usage (RS256, default):
    python scripts/make_test_token.py                 # uses jwt_private.pem
    python scripts/make_test_token.py path/to/key.pem

Usage (HS256, symmetric):
    JWT_ALGORITHM=HS256 JWT_SECRET=your_secret python scripts/make_test_token.py

Prints a token you can use as:  Authorization: Bearer <token>
"""

import os
import sys
import time

import jwt


def main() -> None:
    algo = os.getenv("JWT_ALGORITHM", "RS256").upper()
    ttl_seconds = int(os.getenv("TEST_TOKEN_TTL", "3600"))

    now = int(time.time())
    claims = {
        "sub": os.getenv("TEST_TOKEN_SUB", "vendor-backend"),
        "iat": now,
        "exp": now + ttl_seconds,
    }
    if os.getenv("JWT_ISSUER"):
        claims["iss"] = os.getenv("JWT_ISSUER")
    if os.getenv("JWT_AUDIENCE"):
        claims["aud"] = os.getenv("JWT_AUDIENCE")

    if algo.startswith("HS"):
        key = os.getenv("JWT_SECRET")
        if not key:
            sys.exit("JWT_SECRET must be set for HS* algorithms.")
    else:
        key_path = sys.argv[1] if len(sys.argv) > 1 else "jwt_private.pem"
        if not os.path.exists(key_path):
            sys.exit(f"Private key not found: {key_path} (run generate_jwt_keys.py first).")
        with open(key_path, "r", encoding="utf-8") as f:
            key = f.read()

    token = jwt.encode(claims, key, algorithm=algo)
    print(token)


if __name__ == "__main__":
    main()
