#!/usr/bin/env python3
"""
Test script for the /ws/speech-to-text WebSocket streaming endpoint.

Usage:
    # Basic connectivity test (generates 1 second of silent WAV):
    python test_streaming_stt.py

    # With a real WAV file:
    python test_streaming_stt.py path/to/audio.wav

    # Custom host/port and locale:
    python test_streaming_stt.py path/to/audio.wav --host localhost --port 8000 --locale kn

Requirements (install separately if not in venv):
    pip install websockets
"""

import argparse
import asyncio
import json
import struct
import sys
import time
from pathlib import Path

try:
    import websockets
except ImportError:
    sys.exit("ERROR: 'websockets' package not installed. Run: pip install websockets")


# ---------------------------------------------------------------------------
# WAV helpers
# ---------------------------------------------------------------------------

def _make_silent_wav(duration_seconds: float = 1.0, sample_rate: int = 16000) -> bytes:
    """Generate a minimal mono 16-bit PCM WAV file containing silence."""
    num_samples = int(sample_rate * duration_seconds)
    pcm_bytes = b"\x00\x00" * num_samples  # 16-bit silence

    data_size = len(pcm_bytes)
    riff_size = 36 + data_size

    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",        # ChunkID
        riff_size,      # ChunkSize
        b"WAVE",        # Format
        b"fmt ",        # Subchunk1ID
        16,             # Subchunk1Size (PCM)
        1,              # AudioFormat (PCM = 1)
        1,              # NumChannels (mono)
        sample_rate,    # SampleRate
        sample_rate * 2,  # ByteRate
        2,              # BlockAlign
        16,             # BitsPerSample
        b"data",        # Subchunk2ID
        data_size,      # Subchunk2Size
    )
    return header + pcm_bytes


def _load_wav(path: str) -> bytes:
    """Load raw WAV bytes from a file path."""
    data = Path(path).read_bytes()
    print(f"[test] Loaded WAV: {path} ({len(data):,} bytes)")
    return data


# ---------------------------------------------------------------------------
# WebSocket test
# ---------------------------------------------------------------------------

async def run_test(host: str, port: int, locale: str, audio_bytes: bytes) -> None:
    url = f"ws://{host}:{port}/ws/speech-to-text?locale={locale}"
    print(f"[test] Connecting to {url}")

    async with websockets.connect(url) as ws:
        print(f"[test] Connected. Streaming {len(audio_bytes):,} bytes in chunks...")

        chunk_size = 4096
        chunks_sent = 0
        start = time.monotonic()

        for offset in range(0, len(audio_bytes), chunk_size):
            chunk = audio_bytes[offset : offset + chunk_size]
            await ws.send(chunk)
            chunks_sent += 1
            await asyncio.sleep(0.02)  # 20 ms — simulate real-time mic pacing

        elapsed = time.monotonic() - start
        print(f"[test] Sent {chunks_sent} chunks in {elapsed:.2f}s. Sending 'end' signal...")

        await ws.send(json.dumps({"type": "end"}))

        print("[test] Waiting for server messages (10 s timeout)...")

        try:
            async with asyncio.timeout(10):
                async for raw in ws:
                    if isinstance(raw, bytes):
                        print(f"[test] (binary frame, {len(raw)} bytes — unexpected)")
                        continue
                    try:
                        msg = json.loads(raw)
                    except json.JSONDecodeError:
                        print(f"[test] Non-JSON: {raw!r}")
                        continue

                    msg_type = msg.get("type")
                    if msg_type == "transcript":
                        print(f"[TRANSCRIPT] {msg.get('text', '')!r}")
                    elif msg_type == "speech_start":
                        print("[EVENT] speech_start")
                    elif msg_type == "speech_end":
                        print("[EVENT] speech_end")
                    elif msg_type == "error":
                        print(f"[ERROR] {msg.get('message', '')}")
                    else:
                        print(f"[test] Unknown message: {msg}")

        except TimeoutError:
            print("[test] Timeout waiting for server messages — this is normal for silent audio.")
        except websockets.exceptions.ConnectionClosed as exc:
            print(f"[test] Connection closed by server: {exc.code} {exc.reason}")

    print("[test] Done.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Test /ws/speech-to-text streaming endpoint.")
    parser.add_argument("wav_file", nargs="?", help="Path to a WAV file (optional; generates silence if omitted)")
    parser.add_argument("--host", default="localhost")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--locale", default="en", choices=["en", "kn", "hi"])
    args = parser.parse_args()

    if args.wav_file:
        audio_bytes = _load_wav(args.wav_file)
    else:
        print("[test] No WAV file provided — generating 1 second of silence at 16 kHz 16-bit mono.")
        audio_bytes = _make_silent_wav(duration_seconds=1.0)
        print(f"[test] Generated {len(audio_bytes):,} bytes.")

    asyncio.run(run_test(args.host, args.port, args.locale, audio_bytes))


if __name__ == "__main__":
    main()
