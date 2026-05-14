"""
Streaming Speech-to-Text via Sarvam AI WebSocket.

WebSocket bridge:
    browser  ←→  /ws/speech-to-text  ←→  Sarvam streaming WS

Client → Server messages:
  - binary frame : raw audio bytes (WAV/PCM chunks)
  - JSON text    : {"type": "end"} to signal end of audio

Server → Client messages:
  - {"type": "transcript", "text": "..."}
  - {"type": "speech_start"}
  - {"type": "speech_end"}
  - {"type": "error", "message": "..."}
"""

import asyncio
import base64
import json
import logging
import os
from typing import Optional

from fastapi import WebSocket, WebSocketDisconnect
from sarvamai import AsyncSarvamAI

logger = logging.getLogger(__name__)

_LANGUAGE_CODE_MAP = {
    "en": "en-IN",
    "kn": "kn-IN",
    "hi": "hi-IN",
}

_DEFAULT_LANGUAGE = "kn-IN"


async def handle_streaming_stt(websocket: WebSocket, locale: str) -> None:
    """
    Accept a browser WebSocket connection and bridge it to Sarvam's streaming STT.

    Args:
        websocket: The FastAPI WebSocket instance (not yet accepted).
        locale:    Two-letter locale from the query param ("en", "kn", "hi").
    """
    await websocket.accept()

    api_key: Optional[str] = os.getenv("SARVAMAI_API_KEY")
    if not api_key:
        logger.error("SARVAMAI_API_KEY is not set; refusing streaming STT connection.")
        await websocket.send_text(
            json.dumps({"type": "error", "message": "Server configuration error: missing API key."})
        )
        await websocket.close(code=1008)
        return

    language_code = _LANGUAGE_CODE_MAP.get(locale, _DEFAULT_LANGUAGE)
    logger.info("Streaming STT session started: locale=%s → language_code=%s", locale, language_code)

    client = AsyncSarvamAI(api_subscription_key=api_key)

    try:
        async with client.speech_to_text_streaming.connect(
            model="saaras:v3",
            mode="transcribe",
            language_code=language_code,
            high_vad_sensitivity=True,
            vad_signals=True,
        ) as sarvam_ws:

            async def _receive_from_client() -> None:
                """Forward browser frames to Sarvam until 'end' or disconnect."""
                try:
                    while True:
                        message = await websocket.receive()

                        if "bytes" in message and message["bytes"] is not None:
                            audio_chunk: bytes = message["bytes"]
                            logger.info(f"Received audio chunk: {len(audio_chunk)} bytes")
                            # Convert binary audio to base64 string for Sarvam API
                            audio_base64 = base64.b64encode(audio_chunk).decode('utf-8')
                            await sarvam_ws.transcribe(
                                audio=audio_base64,
                                encoding="audio/wav",
                                sample_rate=16000,
                            )

                        elif "text" in message and message["text"] is not None:
                            try:
                                ctrl = json.loads(message["text"])
                            except json.JSONDecodeError:
                                logger.warning("Non-JSON text frame received; ignoring.")
                                continue

                            if ctrl.get("type") == "end":
                                logger.info("Client signalled end of audio stream.")
                                break
                            else:
                                logger.debug("Unknown control message: %s", ctrl)

                        elif message.get("type") == "websocket.disconnect":
                            logger.info("Client disconnected.")
                            break

                except WebSocketDisconnect:
                    logger.info("WebSocket disconnected during receive.")

            async def _receive_from_sarvam() -> None:
                """Forward Sarvam transcript events to the browser."""
                try:
                    logger.info("Starting to receive messages from Sarvam...")
                    async for message in sarvam_ws:
                        logger.info(f"Received from Sarvam: {message}")
                        msg_type = message.get("type")

                        if msg_type == "transcript":
                            text = message.get("text", "")
                            if text:
                                logger.info(f"Sending transcript to client: {text}")
                                await websocket.send_text(
                                    json.dumps({"type": "transcript", "text": text})
                                )

                        elif msg_type == "speech_start":
                            logger.info("Sending speech_start to client")
                            await websocket.send_text(json.dumps({"type": "speech_start"}))

                        elif msg_type == "speech_end":
                            logger.info("Sending speech_end to client")
                            await websocket.send_text(json.dumps({"type": "speech_end"}))

                        else:
                            logger.info(f"Unhandled Sarvam message type: {msg_type}, full message: {message}")
                    logger.info("Sarvam async iterator exhausted (connection closed)")
                except Exception as e:
                    logger.exception(f"Error in _receive_from_sarvam: {e}")

            receive_task = asyncio.create_task(_receive_from_client())
            sarvam_task = asyncio.create_task(_receive_from_sarvam())

            # Wait for client receive to finish (on "end" signal), then give Sarvam time to process
            done, pending = await asyncio.wait(
                {receive_task, sarvam_task},
                return_when=asyncio.FIRST_COMPLETED,
            )

            # If receive_task finished first (expected), wait a bit for Sarvam to send final messages
            if receive_task in done:
                logger.info("Client finished sending; waiting for Sarvam to complete...")
                try:
                    # Give Sarvam up to 10 seconds to send final responses
                    await asyncio.wait_for(sarvam_task, timeout=10.0)
                except asyncio.TimeoutError:
                    logger.warning("Sarvam task timed out; cancelling it")
                    sarvam_task.cancel()
                    try:
                        await sarvam_task
                    except (asyncio.CancelledError, Exception):
                        pass
            else:
                # Sarvam finished first, cancel the receive task
                receive_task.cancel()
                try:
                    await receive_task
                except (asyncio.CancelledError, Exception):
                    pass

            # Check for exceptions in completed tasks
            for task in [receive_task, sarvam_task]:
                if task.done():
                    exc = task.exception()
                    if exc and not isinstance(exc, asyncio.CancelledError):
                        raise exc

    except WebSocketDisconnect:
        logger.info("Streaming STT session ended by client disconnect.")

    except Exception as exc:
        logger.exception("Streaming STT session error: %s", exc)
        try:
            await websocket.send_text(
                json.dumps({"type": "error", "message": str(exc)})
            )
        except Exception:
            pass
        try:
            await websocket.close(code=1011)
        except Exception:
            pass
        return

    logger.info("Streaming STT session completed cleanly.")
    try:
        await websocket.close(code=1000)
    except Exception:
        pass
