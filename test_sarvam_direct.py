#!/usr/bin/env python3
"""
Test Sarvam API directly without WebSocket to verify it's working.
"""

import asyncio
import base64
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Test the REST endpoint first (which we know works)
def test_rest_endpoint():
    """Test the existing REST /speech-to-text endpoint"""
    import urllib.request
    import urllib.error
    import json

    print("\n=== Testing REST /speech-to-text endpoint ===")

    # Generate simple PCM audio (silence)
    sample_rate = 16000
    duration_sec = 1
    silence = b'\x00\x00' * (sample_rate * duration_sec)

    try:
        import urllib.request
        req = urllib.request.Request("http://localhost:8000/speech-to-text?locale=en", data=silence)
        req.add_header('Content-Type', 'application/octet-stream')

        with urllib.request.urlopen(req, timeout=10) as response:
            data = response.read()
            print(f"Status: {response.status}")
            print(f"Response: {data.decode('utf-8')}")
            print("✅ REST endpoint works!")
            return True
    except Exception as e:
        print(f"❌ REST endpoint failed: {e}")
        return False


# Test Sarvam streaming directly
async def test_sarvam_streaming():
    """Test Sarvam streaming API directly"""
    print("\n=== Testing Sarvam Streaming API directly ===")

    api_key = os.getenv("SARVAMAI_API_KEY")
    if not api_key:
        print("❌ SARVAMAI_API_KEY not set")
        return False

    try:
        from sarvamai import AsyncSarvamAI

        # Generate simple silence audio
        sample_rate = 16000
        duration_sec = 2
        silence = b'\x00\x00' * (sample_rate * duration_sec)
        audio_base64 = base64.b64encode(silence).decode('utf-8')

        client = AsyncSarvamAI(api_subscription_key=api_key)

        print(f"Connecting to Sarvam streaming API...")
        async with client.speech_to_text_streaming.connect(
            model="saaras:v3",
            mode="transcribe",
            language_code="en-IN",
            high_vad_sensitivity=True,
            vad_signals=True,
        ) as sarvam_ws:

            print(f"Connected! Sending {len(silence)} bytes of silence...")
            await sarvam_ws.transcribe(
                audio=audio_base64,
                encoding="audio/wav",
                sample_rate=16000,
            )
            print("Audio sent. Waiting for responses...")

            # Wait for responses with timeout
            responses = []
            try:
                async def collect_with_timeout():
                    try:
                        async for message in sarvam_ws:
                            responses.append(message)
                            print(f"  → {message}")
                    except asyncio.TimeoutError:
                        print(f"  (timeout after 5s, got {len(responses)} messages)")

                await asyncio.wait_for(collect_with_timeout(), timeout=5.0)
            except asyncio.TimeoutError:
                print(f"  (timeout after 5s, got {len(responses)} messages)")

            if responses:
                print(f"✅ Sarvam streaming works! Got {len(responses)} messages")
                return True
            else:
                print(f"⚠️  Connected to Sarvam but got no responses (silence might not trigger STT)")
                return True  # Connection worked, just no transcript for silence

    except Exception as e:
        print(f"❌ Sarvam streaming failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def _drain_messages(sarvam_ws):
    """Helper to drain all messages from Sarvam"""
    async for message in sarvam_ws:
        yield message


async def test_sarvam_with_real_audio():
    """Test Sarvam streaming with actual audio file if available"""
    print("\n=== Testing Sarvam with real audio file ===")

    audio_file = Path("test_audio.wav")
    if not audio_file.exists():
        print(f"⚠️  {audio_file} not found, skipping this test")
        print("  To test with real audio, provide a test_audio.wav file in the project root")
        return None

    api_key = os.getenv("SARVAMAI_API_KEY")
    if not api_key:
        return False

    try:
        from sarvamai import AsyncSarvamAI

        audio_bytes = audio_file.read_bytes()
        audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')

        client = AsyncSarvamAI(api_subscription_key=api_key)

        print(f"Connecting with {len(audio_bytes)} byte audio file...")
        async with client.speech_to_text_streaming.connect(
            model="saaras:v3",
            mode="transcribe",
            language_code="en-IN",
            high_vad_sensitivity=True,
            vad_signals=True,
        ) as sarvam_ws:

            await sarvam_ws.transcribe(
                audio=audio_base64,
                encoding="audio/wav",
                sample_rate=16000,
            )
            print("Audio sent. Waiting for responses...")

            responses = []
            try:
                async def collect_with_timeout():
                    async for message in sarvam_ws:
                        responses.append(message)
                        print(f"  → {message}")

                await asyncio.wait_for(collect_with_timeout(), timeout=5.0)
            except asyncio.TimeoutError:
                print(f"  (timeout after 5s, got {len(responses)} messages)")

            if responses:
                print(f"✅ Got {len(responses)} messages from real audio")
                return True
            else:
                print(f"⚠️  No responses for real audio")
                return False

    except Exception as e:
        print(f"❌ Real audio test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    print("Testing Sarvam API connectivity...")
    print(f"API Key set: {'Yes' if os.getenv('SARVAMAI_API_KEY') else 'No'}")

    # Test REST endpoint
    rest_ok = test_rest_endpoint()

    # Test Sarvam streaming
    streaming_ok = await test_sarvam_streaming()

    # Test with real audio
    real_audio_result = await test_sarvam_with_real_audio()

    print("\n=== Summary ===")
    print(f"REST endpoint: {'✅ Works' if rest_ok else '❌ Failed'}")
    print(f"Sarvam streaming: {'✅ Works' if streaming_ok else '❌ Failed'}")
    if real_audio_result is not None:
        print(f"Real audio: {'✅ Works' if real_audio_result else '⚠️  No responses'}")


if __name__ == "__main__":
    asyncio.run(main())
