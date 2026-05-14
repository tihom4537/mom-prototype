#!/usr/bin/env python3
"""
Debug Sarvam Streaming API - Identify why it returns 0 messages.
Tests multiple scenarios to pinpoint the issue.
"""

import asyncio
import base64
import os
import sys
import struct
import math
import logging

# Enable debug logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

SARVAMAI_API_KEY = 'sk_86w6lw89_8CyDXMtl5JOv4vdVgUeGjdcW'


def create_test_audio(duration=2, frequency=500):
    """Create simple test audio."""
    sample_rate = 16000
    num_samples = sample_rate * duration

    wav_data = bytearray()

    # WAV header
    wav_data.extend(b'RIFF')
    wav_data.extend(struct.pack('<I', 36 + num_samples * 2))
    wav_data.extend(b'WAVE')
    wav_data.extend(b'fmt ')
    wav_data.extend(struct.pack('<I', 16))
    wav_data.extend(struct.pack('<H', 1))   # PCM
    wav_data.extend(struct.pack('<H', 1))   # mono
    wav_data.extend(struct.pack('<I', sample_rate))
    wav_data.extend(struct.pack('<I', sample_rate * 2))
    wav_data.extend(struct.pack('<H', 2))
    wav_data.extend(struct.pack('<H', 16))
    wav_data.extend(b'data')
    wav_data.extend(struct.pack('<I', num_samples * 2))

    # Generate tone
    amplitude = 32767 * 0.7
    for i in range(num_samples):
        t = i / sample_rate
        sample = amplitude * math.sin(2 * math.pi * frequency * t)
        wav_data.extend(struct.pack('<h', int(sample)))

    return bytes(wav_data)


async def test_scenario(name, model="saaras:v3", mode="transcribe", language_code="en-IN",
                       high_vad_sensitivity=True, vad_signals=True, flush_signal=True,
                       audio_data=None, encoding="audio/wav", sample_rate=16000):
    """Test a specific scenario."""
    if audio_data is None:
        audio_data = create_test_audio()

    print(f"\n{'='*70}")
    print(f"TEST: {name}")
    print(f"{'='*70}")
    print(f"Parameters:")
    print(f"  model: {model}")
    print(f"  mode: {mode}")
    print(f"  language_code: {language_code}")
    print(f"  high_vad_sensitivity: {high_vad_sensitivity}")
    print(f"  vad_signals: {vad_signals}")
    print(f"  flush_signal: {flush_signal}")
    print(f"  encoding: {encoding}")
    print(f"  sample_rate: {sample_rate}")
    print(f"  audio_size: {len(audio_data)} bytes\n")

    audio_b64 = base64.b64encode(audio_data).decode('utf-8')

    try:
        from sarvamai import AsyncSarvamAI
    except ImportError:
        print("❌ sarvamai not installed")
        return False

    client = AsyncSarvamAI(api_subscription_key=SARVAMAI_API_KEY)
    responses = []

    try:
        print("🔌 Connecting...")
        async with client.speech_to_text_streaming.connect(
            model=model,
            mode=mode,
            language_code=language_code,
            high_vad_sensitivity=high_vad_sensitivity,
            vad_signals=vad_signals,
            flush_signal=flush_signal,
        ) as ws:
            print("✓ Connected\n")

            print("📤 Sending audio...")
            await ws.transcribe(
                audio=audio_b64,
                encoding=encoding,
                sample_rate=sample_rate,
            )
            print("✓ Audio sent\n")

            if flush_signal:
                print("🔄 Flushing...")
                await ws.flush()
                print("✓ Flushed\n")

            print("👂 Waiting for messages...")
            print("    (timeout: 5 seconds)\n")

            try:
                async def collect():
                    count = 0
                    async for msg in ws:
                        count += 1
                        responses.append(msg)
                        msg_type = msg.get('type', 'unknown')
                        text = msg.get('text', '')
                        print(f"    [{count}] {msg_type}: {text}")

                await asyncio.wait_for(collect(), timeout=5.0)

            except asyncio.TimeoutError:
                print(f"    ⏱️  Timeout (received {len(responses)} messages)\n")

        print(f"\n{'─'*70}")
        print(f"RESULT: {len(responses)} messages received")

        if responses:
            print("✅ WORKS!")
            for i, msg in enumerate(responses, 1):
                print(f"   {i}. {msg}")
        else:
            print("❌ FAILED - No messages returned")
        print(f"{'─'*70}")

        return len(responses) > 0

    except Exception as e:
        print(f"❌ Exception: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


async def run_all_tests():
    """Run multiple test scenarios to identify the issue."""
    print("\n" + "="*70)
    print("SARVAM STREAMING API DEBUG - Testing Multiple Scenarios")
    print("="*70)

    # Test 1: Basic test with default settings
    await test_scenario(
        "Test 1: Basic (saaras:v3, transcribe, en-IN)",
    )

    # Test 2: Without vad_signals
    await test_scenario(
        "Test 2: Without vad_signals",
        vad_signals=False,
    )

    # Test 3: Without flush_signal
    await test_scenario(
        "Test 3: Without flush_signal",
        flush_signal=False,
    )

    # Test 4: With lower VAD sensitivity
    await test_scenario(
        "Test 4: Lower VAD sensitivity",
        high_vad_sensitivity=False,
    )

    # Test 5: Longer audio (speech-like with formants)
    print("\n📝 Creating speech-like audio for Test 5...")
    sample_rate = 16000
    duration = 3
    num_samples = sample_rate * duration

    wav_data = bytearray()
    wav_data.extend(b'RIFF')
    wav_data.extend(struct.pack('<I', 36 + num_samples * 2))
    wav_data.extend(b'WAVE')
    wav_data.extend(b'fmt ')
    wav_data.extend(struct.pack('<I', 16))
    wav_data.extend(struct.pack('<H', 1))
    wav_data.extend(struct.pack('<H', 1))
    wav_data.extend(struct.pack('<I', sample_rate))
    wav_data.extend(struct.pack('<I', sample_rate * 2))
    wav_data.extend(struct.pack('<H', 2))
    wav_data.extend(struct.pack('<H', 16))
    wav_data.extend(b'data')
    wav_data.extend(struct.pack('<I', num_samples * 2))

    amplitude = 32767 * 0.7
    for i in range(num_samples):
        t = i / sample_rate
        f1 = 700 + 100 * math.sin(2 * math.pi * 2 * t)
        f2 = 1200 + 100 * math.sin(2 * math.pi * 1.5 * t)
        sample = (0.5 * amplitude * math.sin(2 * math.pi * f1 * t) +
                  0.5 * amplitude * math.sin(2 * math.pi * f2 * t))

        if t < 0.3:
            sample *= t / 0.3
        elif t > 2.7:
            sample *= (3.0 - t) / 0.3

        wav_data.extend(struct.pack('<h', int(max(-32768, min(32767, sample)))))

    speech_audio = bytes(wav_data)

    await test_scenario(
        "Test 5: Speech-like audio (formants)",
        audio_data=speech_audio,
    )

    # Test 6: Try with kn-IN language
    await test_scenario(
        "Test 6: Kannada language (kn-IN)",
        language_code="kn-IN",
        audio_data=speech_audio,
    )

    # Test 7: Try receiving without async for (using recv())
    print(f"\n{'='*70}")
    print("TEST 7: Using recv() instead of async for")
    print(f"{'='*70}\n")

    try:
        from sarvamai import AsyncSarvamAI
        client = AsyncSarvamAI(api_subscription_key=SARVAMAI_API_KEY)
        audio_data = create_test_audio()
        audio_b64 = base64.b64encode(audio_data).decode('utf-8')

        async with client.speech_to_text_streaming.connect(
            model="saaras:v3",
            mode="transcribe",
            language_code="en-IN",
            vad_signals=True,
            flush_signal=True,
        ) as ws:
            print("✓ Connected\n")

            print("📤 Sending audio...")
            await ws.transcribe(audio=audio_b64, encoding="audio/wav", sample_rate=16000)
            print("✓ Sent\n")

            print("🔄 Flushing...")
            await ws.flush()
            print("✓ Flushed\n")

            print("👂 Calling recv() directly...\n")
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=3.0)
                print(f"✅ Got message: {msg}")
            except asyncio.TimeoutError:
                print("❌ recv() timed out")
            except Exception as e:
                print(f"❌ recv() error: {e}")

    except Exception as e:
        print(f"❌ Exception: {e}")

    print(f"\n{'='*70}")
    print("DEBUG TESTS COMPLETE")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
