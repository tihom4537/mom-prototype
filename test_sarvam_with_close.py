#!/usr/bin/env python3
"""Test Sarvam with explicit close to trigger response processing."""

import asyncio
import base64
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

async def test():
    print("=== Testing Sarvam with explicit close ===")

    api_key = os.getenv("SARVAMAI_API_KEY")
    if not api_key:
        print("❌ SARVAMAI_API_KEY not set")
        return

    from sarvamai import AsyncSarvamAI

    # Load audio
    audio_file = Path("/app/test_audio.wav")
    if not audio_file.exists():
        print(f"❌ {audio_file} not found")
        return

    audio_bytes = audio_file.read_bytes()
    print(f"Loaded {len(audio_bytes)} bytes of audio")

    client = AsyncSarvamAI(api_subscription_key=api_key)

    print("Connecting...")
    async with client.speech_to_text_streaming.connect(
        model="saaras:v3",
        mode="transcribe",
        language_code="en-IN",
        high_vad_sensitivity=True,
        vad_signals=True,
    ) as sarvam_ws:
        print(f"Connected")
        print(f"sarvam_ws type: {type(sarvam_ws)}")
        print(f"Available methods: {[m for m in dir(sarvam_ws) if not m.startswith('_')]}")

        # Send audio
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
        print(f"\nSending {len(audio_bytes)} bytes of audio (base64={len(audio_b64)} chars)...")
        result = await sarvam_ws.transcribe(
            audio=audio_b64,
            encoding="audio/wav",
            sample_rate=16000,
        )
        print(f"transcribe() returned: {result}")

        # Try different ways to get responses
        print("\nMethod 1: Direct async iteration")
        try:
            count = 0
            async for message in sarvam_ws:
                count += 1
                print(f"  {count}. {message}")
                if count > 5:
                    break
            if count == 0:
                print("  (no messages)")
        except Exception as e:
            print(f"  Error: {e}")

    print("\nConnection closed (context manager exited)")

asyncio.run(test())
