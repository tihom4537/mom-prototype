#!/usr/bin/env python3
"""
Test Sarvam Streaming API with WAV format (raw PCM inside WAV container).
"""

import asyncio
import base64
import os
import struct
import math

SARVAMAI_API_KEY = 'sk_86w6lw89_8CyDXMtl5JOv4vdVgUeGjdcW'


def create_wav_audio(duration=2, frequency=500):
    """Create WAV file with PCM audio."""
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


def create_wav_speech(duration=3):
    """Create WAV file with speech-like audio."""
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

    # Formants (speech-like)
    amplitude = 32767 * 0.7
    for i in range(num_samples):
        t = i / sample_rate

        if t < 1.0:
            f1, f2 = 700, 1220
        elif t < 2.0:
            f1, f2 = 250, 2000
        else:
            f1, f2 = 300, 2700

        sample = (0.5 * amplitude * math.sin(2 * math.pi * f1 * t) +
                  0.5 * amplitude * math.sin(2 * math.pi * f2 * t))

        if t < 0.3:
            sample *= t / 0.3
        elif t > 2.7:
            sample *= (3.0 - t) / 0.3

        wav_data.extend(struct.pack('<h', int(max(-32768, min(32767, sample)))))

    return bytes(wav_data)


async def test():
    print("=" * 70)
    print("Testing Sarvam Streaming with WAV Audio (PCM inside WAV container)")
    print("=" * 70)

    try:
        from sarvamai import AsyncSarvamAI
    except ImportError:
        print("❌ sarvamai not installed")
        return

    client = AsyncSarvamAI(api_subscription_key=SARVAMAI_API_KEY)

    # Test 1: Tone
    print("\n" + "─" * 70)
    print("TEST 1: 500Hz Tone (WAV format)")
    print("─" * 70)

    wav_data = create_wav_audio(duration=2, frequency=500)
    wav_b64 = base64.b64encode(wav_data).decode('utf-8')

    print(f"WAV file: {len(wav_data)} bytes")
    print(f"Base64: {len(wav_b64)} bytes\n")

    try:
        async with client.speech_to_text_streaming.connect(
            model="saaras:v3",
            mode="transcribe",
            language_code="en-IN",
            high_vad_sensitivity=True,
            vad_signals=True,
            flush_signal=True,
        ) as ws:
            print("✓ Connected\n")

            print("📤 Sending audio...")
            await ws.transcribe(
                audio=wav_b64,
                encoding="audio/wav",  # Using WAV encoding
                sample_rate=16000,
            )
            print("✓ Sent\n")

            print("🔄 Flushing...")
            await ws.flush()
            print("✓ Flushed\n")

            print("👂 Listening...\n")

            responses = []
            try:
                async def collect():
                    async for msg in ws:
                        responses.append(msg)
                        msg_type = msg.get('type', 'unknown')
                        text = msg.get('text', '')
                        print(f"   [{len(responses)}] {msg_type}: {text}")

                await asyncio.wait_for(collect(), timeout=5.0)
            except asyncio.TimeoutError:
                print(f"   ⏱️  Timeout ({len(responses)} messages)\n")

        if responses:
            print("✅ TEST 1 SUCCESS\n")
            for i, msg in enumerate(responses, 1):
                print(f"  {i}. {msg}")
        else:
            print("❌ TEST 1: Got 0 messages\n")

    except Exception as e:
        print(f"❌ Error: {e}\n")
        import traceback
        traceback.print_exc()

    # Test 2: Speech-like
    print("\n" + "─" * 70)
    print("TEST 2: Speech-like Audio (WAV format)")
    print("─" * 70)

    wav_data = create_wav_speech(duration=3)
    wav_b64 = base64.b64encode(wav_data).decode('utf-8')

    print(f"WAV file: {len(wav_data)} bytes")
    print(f"Base64: {len(wav_b64)} bytes\n")

    try:
        async with client.speech_to_text_streaming.connect(
            model="saaras:v3",
            mode="transcribe",
            language_code="en-IN",
            high_vad_sensitivity=True,
            vad_signals=True,
            flush_signal=True,
        ) as ws:
            print("✓ Connected\n")

            print("📤 Sending audio...")
            await ws.transcribe(
                audio=wav_b64,
                encoding="audio/wav",
                sample_rate=16000,
            )
            print("✓ Sent\n")

            print("🔄 Flushing...")
            await ws.flush()
            print("✓ Flushed\n")

            print("👂 Listening...\n")

            responses = []
            try:
                async def collect():
                    async for msg in ws:
                        responses.append(msg)
                        msg_type = msg.get('type', 'unknown')
                        text = msg.get('text', '')
                        print(f"   [{len(responses)}] {msg_type}: {text}")

                await asyncio.wait_for(collect(), timeout=5.0)
            except asyncio.TimeoutError:
                print(f"   ⏱️  Timeout ({len(responses)} messages)\n")

        if responses:
            print("✅ TEST 2 SUCCESS\n")
            for i, msg in enumerate(responses, 1):
                print(f"  {i}. {msg}")
        else:
            print("❌ TEST 2: Got 0 messages\n")

    except Exception as e:
        print(f"❌ Error: {e}\n")
        import traceback
        traceback.print_exc()

    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(test())
