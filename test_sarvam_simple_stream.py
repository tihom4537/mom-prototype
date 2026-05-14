#!/usr/bin/env python3
"""
Simple Sarvam Streaming API test - no external dependencies needed.
"""

import asyncio
import base64
import os
import sys
import struct
import math


async def test():
    # Get API key from environment or .env file
    api_key = os.getenv('SARVAMAI_API_KEY')

    if not api_key:
        # Try reading from .env file directly
        try:
            with open('.env', 'r') as f:
                for line in f:
                    if line.startswith('SARVAMAI_API_KEY='):
                        api_key = line.split('=', 1)[1].strip()
                        break
        except:
            pass

    if not api_key:
        print("❌ SARVAMAI_API_KEY not found")
        return False

    print("=" * 70)
    print("Sarvam Streaming STT Test - Simple Version")
    print("=" * 70)
    print(f"API Key: {api_key[:20]}...\n")

    # Create synthetic speech-like audio
    print("📝 Creating synthetic speech audio...")
    sample_rate = 16000
    duration = 2
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

    # Speech-like audio with formants
    amplitude = 32767 * 0.7
    for i in range(num_samples):
        t = i / sample_rate

        # Vowel sounds
        if t < 0.7:
            f1, f2 = 700, 1220
        elif t < 1.4:
            f1, f2 = 250, 2000
        else:
            f1, f2 = 300, 2700

        sample = (0.6 * amplitude * math.sin(2 * math.pi * f1 * t) +
                  0.4 * amplitude * math.sin(2 * math.pi * f2 * t))

        # Envelope
        if t < 0.2:
            envelope = t / 0.2
        elif t > 1.8:
            envelope = (2.0 - t) / 0.2
        else:
            envelope = 1.0

        sample *= envelope
        wav_data.extend(struct.pack('<h', int(max(-32768, min(32767, sample)))))

    audio_bytes = bytes(wav_data)
    audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')

    print(f"✓ Audio created: {len(audio_bytes)} bytes\n")

    # Import sarvamai
    try:
        from sarvamai import AsyncSarvamAI
        print("✓ sarvamai SDK imported\n")
    except ImportError as e:
        print(f"❌ Cannot import sarvamai: {e}")
        print("   Install with: pip install sarvamai")
        return False

    # Test streaming API
    client = AsyncSarvamAI(api_subscription_key=api_key)

    print("=" * 70)
    print("🔌 Connecting to Sarvam Streaming API...")
    print("=" * 70 + "\n")

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
                audio=audio_b64,
                encoding="audio/wav",
                sample_rate=16000,
            )
            print("✓ Sent\n")

            print("🔄 Flushing...")
            await ws.flush()
            print("✓ Flushed\n")

            print("👂 Listening for responses...\n")

            responses = []
            try:
                async def collect():
                    async for msg in ws:
                        responses.append(msg)
                        msg_type = msg.get('type', 'unknown')
                        if msg_type == 'speech_start':
                            print("   🎤 speech_start")
                        elif msg_type == 'speech_end':
                            print("   🛑 speech_end")
                        elif msg_type == 'transcript':
                            text = msg.get('text', '')
                            print(f"   📝 transcript: {text}")
                        else:
                            print(f"   ℹ️  {msg_type}")

                await asyncio.wait_for(collect(), timeout=10.0)

            except asyncio.TimeoutError:
                print(f"\n⏱️  Timeout (got {len(responses)} messages)")

        print("\n" + "=" * 70)

        if responses:
            print(f"✅ SUCCESS: Received {len(responses)} messages")
            print("=" * 70)
            for i, msg in enumerate(responses, 1):
                print(f"{i}. {msg}")
            return True
        else:
            print("❌ FAILED: No messages from Sarvam")
            print("=" * 70)
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test())
    sys.exit(0 if success else 1)
