import base64
import logging
import os
from typing import Dict

import httpx


logger = logging.getLogger(__name__)


SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"


_LANGUAGE_CODE_MAP: Dict[str, str] = {
    "en": "kn-IN",  # Force kn-IN regardless of UI toggle — auto-detect picks Hindi wrongly
    "kn": "kn-IN",
}


async def transcribe_audio_data_uri(audio_data_uri: str, locale: str) -> str:
    """
    Call SarvamAI Speech-to-Text REST API using an audio data URI.

    This mirrors the behavior of the provided TypeScript `speechToText` function:
    - Validates that the API key is set.
    - Extracts and decodes the Base64 payload from the data URI.
    - Sends the audio as multipart/form-data to Sarvam's /speech-to-text endpoint.
    - Returns the `transcript` field from the response (or an empty string).
    """
    SARVAMAI_API_KEY = os.getenv("SARVAMAI_API_KEY")
    if not SARVAMAI_API_KEY:
        logger.error("SarvamAI API key is not set.")
        raise RuntimeError("Server configuration error: Missing API key.")

    try:
        header, base64_data = audio_data_uri.split(",", 1)
    except ValueError as exc:
        raise ValueError("Invalid audio data URI format.") from exc

    if not base64_data:
        raise ValueError("Invalid audio data URI format.")

    # Derive MIME type from the data URI header if possible.
    # Example header: 'data:audio/webm;codecs=opus;base64'
    mime_type = "application/octet-stream"
    if header.startswith("data:") and ";base64" in header:
        try:
            mime_type_part = header[5:].split(";")[0]
            if mime_type_part:
                mime_type = mime_type_part
        except Exception:
            pass

    try:
        audio_bytes = base64.b64decode(base64_data)
    except Exception as exc:
        raise ValueError("Failed to decode Base64 audio data.") from exc

    # Prefer the newer Saaras v3 model, but you can switch to Saarika v2.5
    # by changing this value if needed.
    model_name = "saarika:v2.5"

    data = {
        "model": model_name,
        "mode": "transcribe",
    }

    language_code = _LANGUAGE_CODE_MAP.get(locale)
    if language_code:
        data["language_code"] = language_code

    headers = {
        "api-subscription-key": SARVAMAI_API_KEY,  # type: ignore[arg-type]
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                SARVAM_STT_URL,
                headers=headers,
                data=data,
                files={"file": ("audio", audio_bytes, mime_type)},
            )

        response.raise_for_status()

        payload = response.json()
        transcription = payload.get("transcript") or ""
        return transcription

    except httpx.HTTPError as exc:
        logger.error("Error during SarvamAI speech-to-text API call: %s", exc)
        raise

