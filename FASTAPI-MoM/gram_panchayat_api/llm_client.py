import asyncio
import json
import os
from pathlib import Path
from typing import Any, Dict, Optional

import httpx
from dotenv import load_dotenv


class LLMClientError(Exception):
    """Custom exception for LLM client errors."""


GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"

_DOTENV_PATH = Path(__file__).with_name(".env")
_HTTP_CLIENT: Optional[httpx.AsyncClient] = None


def _load_env() -> None:
    # Explicit path makes local/dev behavior predictable.
    # In production, prefer real environment variables over .env files.
    load_dotenv(dotenv_path=_DOTENV_PATH, override=False)


def _get_env(name: str) -> Optional[str]:
    _load_env()
    return os.getenv(name)


def _get_http_client(timeout: float) -> httpx.AsyncClient:
    global _HTTP_CLIENT
    if _HTTP_CLIENT is None or _HTTP_CLIENT.is_closed:
        _HTTP_CLIENT = httpx.AsyncClient(timeout=timeout)
    else:
        _HTTP_CLIENT.timeout = timeout  # type: ignore[attr-defined]
    return _HTTP_CLIENT


async def aclose_llm_http_client() -> None:
    """Close the shared HTTP client (call on app shutdown)."""
    global _HTTP_CLIENT
    if _HTTP_CLIENT is not None and not _HTTP_CLIENT.is_closed:
        await _HTTP_CLIENT.aclose()
    _HTTP_CLIENT = None


async def generate_text(
    prompt: str,
    *,
    model: Optional[str] = None,
    max_retries: int = 2,
    timeout: float = 90.0,
    response_mime_type: Optional[str] = None,
    generation_config: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Call the Gemini API (or another compatible model) and return the generated text.

    - Uses Gemini 2.5 Flash Lite Preview by default (model: gemini-3.1-flash-lite-preview).
    - Retries up to `max_retries` times on failure with a 1 second delay.
    - To switch models, set the LLM_MODEL_NAME env var or pass `model` explicitly.
    """
    api_key = _get_env("GEMINI_API_KEY")
    if not api_key:
        raise LLMClientError("GEMINI_API_KEY is not set in the environment.")

    default_model = _get_env("LLM_MODEL_NAME") or "gemini-3.1-flash-lite-preview"
    model_name = model or default_model

    # For Gemini, the model name is part of the URL path.
    url = (
        f"{GEMINI_BASE_URL}/models/{model_name}:generateContent"
        f"?key={api_key}"
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt,
                    }
                ]
            }
        ]
    }

    if response_mime_type or generation_config:
        payload["generationConfig"] = {
            **(generation_config or {}),
            **({"responseMimeType": response_mime_type} if response_mime_type else {}),
        }

    last_error: Optional[Exception] = None

    for attempt in range(max_retries + 1):
        try:
            client = _get_http_client(timeout)
            response = await client.post(url, json=payload)

            response.raise_for_status()

            data = response.json()

            try:
                return data["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError) as exc:
                raise LLMClientError(
                    f"Unexpected LLM response format: {json.dumps(data)[:500]}"
                ) from exc

        except (httpx.HTTPError, LLMClientError) as exc:
            last_error = exc
            if attempt < max_retries:
                await asyncio.sleep(1)
                continue
            raise LLMClientError(str(exc)) from exc

    # Should not be reached, but kept for safety.
    if last_error:
        raise LLMClientError(str(last_error))
    raise LLMClientError("Unknown error calling LLM.")

