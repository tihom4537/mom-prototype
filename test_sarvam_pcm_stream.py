#!/usr/bin/env python3
"""
Test Sarvam Streaming API with raw PCM audio (the correct format).
This will confirm if streaming works when we send the right audio format.
"""

import asyncio
import base64
import os
import sys
import struct
import math

SARVAMAI_API_KEY = 'sk_86w6lw89_8CyDXMtl5JOv4vdVgUeGjdcW'


def create_raw_pcm_audio(duration=2, frequency=500):
    """Create raw 16-bit PCM audio (no WAV header)."""
    sample_rate = 16000
    num_samples = sample_rate * duration

    pcm_data = bytearray()

    # Generate tone
    amplitude = 32767 * 0.7
    for i in range(num_samples):
        t = i / sample_rate
        sample = amplitude * math.sin(2 * math.pi * frequency * t)
        pcm_data.extend(struct.pack('<h', int(sample)))

    return bytes(pcm_data)


def create_speech_like_pcm(duration=3):
    """Create speech-like PCM audio."""
    sample_rate = 16000
    num_samples = sample_rate * duration

    pcm_data = bytearray()

    amplitude = 32767 * 0.7
    for i in range(num_samples):
        t = i / sample_rate

        # Vowel sounds (formants)
        if t < 1.0:
            f1, f2 = 700, 1220
        elif t < 2.0:
            f1, f2 = 250, 2000
        else:
            f1, f2 = 300, 2700

        sample = (0.5 * amplitude * math.sin(2 * math.pi * f1 * t) +
                  0.5 * amplitude * math.sin(2 * math.pi * f2 * t))

        # Envelope
        if t < 0.3:
            sample *= t / 0.3
        elif t > 2.7:
            sample *= (3.0 - t) / 0.3

        pcm_data.extend(struct.pack('<h', int(max(-32768, min(32767, sample)))))

    return bytes(pcm_data)


async def test_streaming_with_pcm():
    print("=" * 70)
    print("Testing Sarvam Streaming API with RAW PCM (Correct Format)")
    print("=" * 70)

    try:
        from sarvamai import AsyncSarvamAI
    except ImportError:
        print("❌ sarvamai not installed")
        return False

    client = AsyncSarvamAI(api_subscription_key=SARVAMAI_API_KEY)

    # Test 1: Simple tone
    print("\n" + "─" * 70)
    print("TEST 1: Simple 500Hz Tone")
    print("─" * 70)

    pcm_data = create_raw_pcm_audio(duration=2, frequency=500)
    pcm_b64 = base64.b64encode(pcm_data).decode('utf-8')

    print(f"PCM data: {len(pcm_data)} bytes (2 seconds @ 16kHz, 16-bit)")
    print(f"Base64: {len(pcm_b64)} bytes\n")

    try:
        async with client.speech_to_text_streaming.connect(
            model="saaras:v3",
            mode="transcribe",
            language_code="en-IN",
            sample_rate=16000,
            input_audio_codec="pcm_s16le",  # CRUCIAL: Tell Sarvam this is raw PCM
            high_vad_sensitivity=True,
            vad_signals=True,
            flush_signal=True,
        ) as ws:
            print("✓ Connected\n")

            print("📤 Sending PCM audio...")
            await ws.transcribe(
                audio=pcm_b64,
                encoding="audio/pcm",  # Tell Sarvam it's PCM
                sample_rate=16000,
            )
            print("✓ Sent\n")

            print("🔄 Flushing...")
            await ws.flush()
            print("✓ Flushed\n")

            print("👂 Waiting for responses...\n")

            responses = []
            try:
                async def collect():
                    async for msg in ws:
                        responses.append(msg)
                        msg_type = msg.get('type', 'unknown')
                        text = msg.get('text', '')
                        if msg_type == 'speech_start':
                            print("   🎤 speech_start")
                        elif msg_type == 'speech_end':
                            print("   🛑 speech_end")
                        elif msg_type == 'transcript':
                            print(f"   📝 transcript: {text}")
                        else:
                            print(f"   ℹ️  {msg_type}")

                await asyncio.wait_for(collect(), timeout=5.0)

            except asyncio.TimeoutError:
                print(f"\n⏱️  Timeout (got {len(responses)} messages)\n")

        if responses:
            print("✅ TEST 1 PASSED - Got responses!\n")
        else:
            print("❌ TEST 1 FAILED - No responses\n")

    except Exception as e:
        print(f"❌ Exception: {e}\n")

    # Test 2: Speech-like audio
    print("─" * 70)
    print("TEST 2: Speech-like PCM (Formants)")
    print("─" * 70)

    pcm_data = create_speech_like_pcm(duration=3)
    pcm_b64 = base64.b64encode(pcm_data).decode('utf-8')

    print(f"PCM data: {len(pcm_data)} bytes (3 seconds @ 16kHz, 16-bit)")
    print(f"Base64: {len(pcm_b64)} bytes\n")

    try:
        async with client.speech_to_text_streaming.connect(
            model="saaras:v3",
            mode="transcribe",
            language_code="en-IN",
            sample_rate=16000,
            input_audio_codec="pcm_s16le",
            high_vad_sensitivity=True,
            vad_signals=True,
            flush_signal=True,
        ) as ws:
            print("✓ Connected\n")

            print("📤 Sending PCM audio...")
            await ws.transcribe(
                audio=pcm_b64,
                encoding="audio/pcm",
                sample_rate=16000,
            )
            print("✓ Sent\n")

            print("🔄 Flushing...")
            await ws.flush()
            print("✓ Flushed\n")

            print("👂 Waiting for responses...\n")

            responses = []
            try:
                async def collect():
                    async for msg in ws:
                        responses.append(msg)
                        msg_type = msg.get('type', 'unknown')
                        text = msg.get('text', '')
                        if msg_type == 'speech_start':
                            print("   🎤 speech_start")
                        elif msg_type == 'speech_end':
                            print("   🛑 speech_end")
                        elif msg_type == 'transcript':
                            print(f"   📝 transcript: {text}")
                        else:
                            print(f"   ℹ️  {msg_type}")

                await asyncio.wait_for(collect(), timeout=5.0)

            except asyncio.TimeoutError:
                print(f"\n⏱️  Timeout (got {len(responses)} messages)\n")

        if responses:
            print("✅ TEST 2 PASSED - Got responses!\n")
        else:
            print("❌ TEST 2 FAILED - No responses\n")

    except Exception as e:
        print(f"❌ Exception: {e}\n")

    print("=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print("\nIf both tests returned 0 messages:")
    print("  → Issue is with audio format (encoding parameter)")
    print("\nIf tests returned responses:")
    print("  → SUCCESS! Streaming API works with PCM")
    print("  → We need to add ffmpeg to convert WebM→PCM in backend")
    print("\n" + "=" * 70)


if __name__ == "__main__":
    asyncio.run(test_streaming_with_pcm())
