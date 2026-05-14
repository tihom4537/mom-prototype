"""
Speech-to-Text via WebSocket using Sarvam AI REST API.

WebSocket bridge:
    browser  ←→  /ws/speech-to-text  ←→  Sarvam REST API

Client → Server messages:
  - binary frame : raw audio bytes (WebM/Opus chunks)
  - JSON text    : {"type": "end"} to signal end of audio

Server → Client messages:
  - {"type": "transcript", "text": "..."}
  - {"type": "error", "message": "..."}

Note: Uses REST API (proven working) instead of streaming API (broken).
Accumulates audio chunks and transcribes on "end" signal.
"""

import base64
import json
import logging
import os
from typing import Optional

from fastapi import WebSocket, WebSocketDisconnect

from .speech_to_text import transcribe_audio_data_uri

logger = logging.getLogger(__name__)

_LANGUAGE_CODE_MAP = {
    "en": "en-IN",
    "kn": "kn-IN",
    "hi": "hi-IN",
}

_DEFAULT_LANGUAGE = "kn-IN"


async def handle_streaming_stt(websocket: WebSocket, locale: str) -> None:
    """
    Accept a browser WebSocket connection and provide STT via REST API.

    Accumulates audio chunks from browser, calls REST API on "end" signal,
    and returns transcript via WebSocket.

    Args:
        websocket: The FastAPI WebSocket instance (not yet accepted).
        locale:    Two-letter locale from the query param ("en", "kn", "hi").
    """
    await websocket.accept()
    logger.info("STT session started: locale=%s", locale)

    audio_chunks = bytearray()

    try:
        while True:
            message = await websocket.receive()

            if "bytes" in message and message["bytes"] is not None:
                chunk: bytes = message["bytes"]
                logger.debug(f"Received audio chunk: {len(chunk)} bytes")
                audio_chunks.extend(chunk)

            elif "text" in message and message["text"] is not None:
                try:
                    ctrl = json.loads(message["text"])
                except json.JSONDecodeError:
                    logger.warning("Non-JSON text frame received; ignoring.")
                    continue

                if ctrl.get("type") == "end":
                    logger.info(f"Client signalled end of audio. Total: {len(audio_chunks)} bytes")

                    if not audio_chunks:
                        logger.warning("Received 'end' but no audio data")
                        await websocket.send_text(
                            json.dumps({"type": "error", "message": "No audio data received."})
                        )
                        break

                    try:
                        # Convert audio bytes to data URI format for REST API
                        audio_b64 = base64.b64encode(bytes(audio_chunks)).decode('utf-8')
                        audio_data_uri = f"data:audio/webm;base64,{audio_b64}"

                        logger.info("Calling REST API for transcription...")
                        transcript = await transcribe_audio_data_uri(audio_data_uri, locale)

                        logger.info(f"Sending transcript to client: {transcript}")
                        await websocket.send_text(
                            json.dumps({"type": "transcript", "text": transcript})
                        )

                    except Exception as e:
                        logger.exception(f"Error during transcription: {e}")
                        await websocket.send_text(
                            json.dumps({"type": "error", "message": f"Transcription failed: {str(e)}"})
                        )

                    break

                else:
                    logger.debug(f"Unknown control message: {ctrl}")

            elif message.get("type") == "websocket.disconnect":
                logger.info("Client disconnected.")
                break

    except WebSocketDisconnect:
        logger.info("WebSocket disconnected.")

    except Exception as exc:
        logger.exception(f"Error: {exc}")
        try:
            await websocket.send_text(
                json.dumps({"type": "error", "message": str(exc)})
            )
        except Exception:
            pass

    finally:
        try:
            await websocket.close(code=1000)
        except Exception:
            pass
        logger.info("STT session closed.")
