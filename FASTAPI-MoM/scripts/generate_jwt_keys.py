"""
Generate an RSA key pair for RS256 JWT auth.

Writes `jwt_private.pem` and `jwt_public.pem` to the current directory.

Key custody (recommended):
- The *caller* (the vendor's backend that signs tokens) keeps `jwt_private.pem`.
- This microservice only needs `jwt_public.pem` — set it as JWT_PUBLIC_KEY_PATH
  (or paste its contents into JWT_PUBLIC_KEY). The private key never touches this
  service, so a compromise here cannot forge tokens.

Whoever will *sign* tokens should ideally run this and share only the public key.

Usage:
    python scripts/generate_jwt_keys.py
"""

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


def main() -> None:
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)

    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    with open("jwt_private.pem", "wb") as f:
        f.write(private_pem)
    with open("jwt_public.pem", "wb") as f:
        f.write(public_pem)

    print("Wrote jwt_private.pem (give to the token SIGNER — keep secret)")
    print("Wrote jwt_public.pem  (give to this microservice — JWT_PUBLIC_KEY_PATH)")


if __name__ == "__main__":
    main()
