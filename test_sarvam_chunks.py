#!/usr/bin/env python3
"""Test Sarvam with chunked audio (streaming) like WebSocket handler."""

import asyncio
import base64
import os
import time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

async def test_sarvam_chunked():
    """Send audio in chunks like the WebSocket handler does."""
    print("\n=== Testing Sarvam Streaming API with chunked audio ===")

    api_key = os.getenv("SARVAMAI_API_KEY")
    if not api_key:
        print("❌ SARVAMAI_API_KEY not set")
        return False

    try:
        from sarvamai import AsyncSarvamAI

        # Load test audio
        audio_file = Path("/app/test_audio.wav")
        if not audio_file.exists():
            print(f"❌ {audio_file} not found")
            return False

        audio_bytes = audio_file.read_bytes()
        chunk_size = 2048
        chunks = [audio_bytes[i:i+chunk_size] for i in range(0, len(audio_bytes), chunk_size)]

        print(f"Audio file: {len(audio_bytes)} bytes")
        print(f"Split into {len(chunks)} chunks of ~{chunk_size} bytes each")

        client = AsyncSarvamAI(api_subscription_key=api_key)

        print("Connecting to Sarvam streaming API...")
        async with client.speech_to_text_streaming.connect(
            model="saaras:v3",
            mode="transcribe",
            language_code="en-IN",
            high_vad_sensitivity=True,
            vad_signals=True,
        ) as sarvam_ws:

            print("Connected! Sending chunks...")
            # Send chunks with slight delay between them (simulating real-time)
            for idx, chunk in enumerate(chunks):
                audio_b64 = base64.b64encode(chunk).decode('utf-8')
                await sarvam_ws.transcribe(
                    audio=audio_b64,
                    encoding="audio/wav",
                    sample_rate=16000,
                )
                print(f"  Sent chunk {idx+1}/{len(chunks)} ({len(chunk)} bytes)")
                await asyncio.sleep(0.05)  # 50ms between chunks

            print("All chunks sent. Flushing buffer...")
            await sarvam_ws.flush()
            print("Buffer flushed. Waiting for responses...")

            responses = []
            try:
                async def collect_with_timeout():
                    async for message in sarvam_ws:
                        responses.append(message)
                        print(f"  ✓ {message}")

                await asyncio.wait_for(collect_with_timeout(), timeout=10.0)
            except asyncio.TimeoutError:
                print(f"  (timeout after 10s)")

            if responses:
                print(f"✅ Got {len(responses)} messages!")
                return True
            else:
                print(f"⚠️  No responses for chunked audio")
                return False

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    result = await test_sarvam_chunked()
    print(f"\nResult: {'✅ WORKS' if result else '❌ NO RESPONSE'}")


if __name__ == "__main__":
    asyncio.run(main())
