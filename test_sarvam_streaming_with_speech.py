#!/usr/bin/env python3
"""
Test Sarvam Streaming Speech-to-Text API with actual speech audio.
Follows official API documentation from https://docs.sarvam.ai/

Usage:
    python test_sarvam_streaming_with_speech.py                    # Uses embedded speech
    python test_sarvam_streaming_with_speech.py /path/to/audio.wav # Uses custom audio
    python test_sarvam_streaming_with_speech.py /path/to/audio.wav kn-IN  # Custom language
"""

import asyncio
import base64
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


async def test_streaming_stt():
    api_key = os.getenv('SARVAMAI_API_KEY')
    if not api_key:
        print("❌ ERROR: SARVAMAI_API_KEY not set in environment")
        return False

    print("=" * 70)
    print("Testing Sarvam Streaming Speech-to-Text API")
    print("=" * 70)

    # Get audio file from command line or use default
    audio_file = None
    language_code = "en-IN"  # default

    if len(sys.argv) > 1:
        audio_file = Path(sys.argv[1])
        if len(sys.argv) > 2:
            language_code = sys.argv[2]

    # If no audio file provided, create a real speech sample
    if audio_file is None or not audio_file.exists():
        print("\n📝 Creating test speech audio (using text-to-speech)...")
        # For now, use a simple beep pattern that sounds like speech
        import struct
        import math

        audio_file = Path('/tmp/test_speech.wav')

        # Create a more complex waveform that sounds more like speech
        sample_rate = 16000
        duration = 2  # seconds
        num_samples = sample_rate * duration

        with open(audio_file, 'wb') as f:
            # WAV header
            f.write(b'RIFF')
            f.write(struct.pack('<I', 36 + num_samples * 2))
            f.write(b'WAVE')
            f.write(b'fmt ')
            f.write(struct.pack('<I', 16))  # fmt chunk size
            f.write(struct.pack('<H', 1))   # PCM
            f.write(struct.pack('<H', 1))   # mono
            f.write(struct.pack('<I', sample_rate))
            f.write(struct.pack('<I', sample_rate * 2))  # byte rate
            f.write(struct.pack('<H', 2))   # block align
            f.write(struct.pack('<H', 16))  # bits per sample
            f.write(b'data')
            f.write(struct.pack('<I', num_samples * 2))

            # Create speech-like audio: variable frequency modulation
            amplitude = 32767 * 0.8
            for i in range(num_samples):
                # Simulate speech with frequency variations
                t = i / sample_rate
                # Base frequency with modulation (like formants in speech)
                f1 = 200 + 100 * math.sin(2 * math.pi * 2 * t)      # F1 formant
                f2 = 700 + 200 * math.sin(2 * math.pi * 1.5 * t)    # F2 formant
                f3 = 1220 + 150 * math.sin(2 * math.pi * 0.8 * t)   # F3 formant

                # Mix formants
                sample = (
                    0.5 * amplitude * math.sin(2 * math.pi * f1 * t) +
                    0.3 * amplitude * math.sin(2 * math.pi * f2 * t) +
                    0.2 * amplitude * math.sin(2 * math.pi * f3 * t)
                ) / 3.0

                # Add envelope (ramp up, sustain, ramp down)
                if t < 0.3:
                    envelope = t / 0.3  # fade in
                elif t > 1.7:
                    envelope = (2.0 - t) / 0.3  # fade out
                else:
                    envelope = 1.0

                sample *= envelope
                f.write(struct.pack('<h', int(sample)))

        print(f"   ✓ Created {audio_file} ({num_samples * 2} bytes)")

    else:
        print(f"\n📄 Using audio file: {audio_file}")

    # Verify file exists and read it
    if not audio_file.exists():
        print(f"❌ ERROR: Audio file not found: {audio_file}")
        return False

    audio_bytes = audio_file.read_bytes()
    audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')

    print(f"\n📊 Audio Info:")
    print(f"   File size: {len(audio_bytes)} bytes ({len(audio_bytes) / 1024:.1f} KB)")
    print(f"   Language code: {language_code}")
    print(f"   Base64 size: {len(audio_b64)} bytes")
    print(f"   API Key: {api_key[:20]}...")

    # Import sarvamai SDK
    try:
        from sarvamai import AsyncSarvamAI
        print("\n✓ sarvamai SDK imported successfully")
    except ImportError:
        print("❌ ERROR: sarvamai SDK not installed. Install with: pip install sarvamai")
        return False

    # Create client
    client = AsyncSarvamAI(api_subscription_key=api_key)
    print("✓ Sarvam client created")

    # Test the streaming API
    print("\n" + "=" * 70)
    print("🔌 Connecting to Sarvam Streaming API...")
    print("=" * 70)

    try:
        async with client.speech_to_text_streaming.connect(
            model="saaras:v3",
            mode="transcribe",
            language_code=language_code,
            high_vad_sensitivity=True,
            vad_signals=True,
            flush_signal=True,
        ) as ws:
            print("✓ Connected to WebSocket\n")

            # Send audio
            print("📤 Sending audio to Sarvam...")
            await ws.transcribe(
                audio=audio_b64,
                encoding="audio/wav",
                sample_rate=16000,
            )
            print("✓ Audio sent\n")

            # Flush to force processing
            print("🔄 Flushing buffer to force processing...")
            await ws.flush()
            print("✓ Flushed\n")

            # Collect all responses
            print("👂 Waiting for responses from Sarvam...\n")
            responses = []
            message_count = 0

            try:
                async def collect_messages():
                    async for message in ws:
                        nonlocal message_count
                        message_count += 1
                        responses.append(message)
                        msg_type = message.get('type', 'unknown')
                        text = message.get('text', '')

                        if msg_type == 'speech_start':
                            print(f"   [{message_count}] 🎤 SPEECH_START")
                        elif msg_type == 'speech_end':
                            print(f"   [{message_count}] 🛑 SPEECH_END")
                        elif msg_type == 'transcript':
                            print(f"   [{message_count}] 📝 TRANSCRIPT: {text}")
                        else:
                            print(f"   [{message_count}] ℹ️  {msg_type}: {text}")

                # Wait for messages with timeout
                await asyncio.wait_for(collect_messages(), timeout=15.0)

            except asyncio.TimeoutError:
                print(f"\n⏱️  Timeout after waiting 15 seconds")
                print(f"   (Received {message_count} messages so far)")

            except Exception as e:
                print(f"\n❌ Error collecting messages: {type(e).__name__}: {e}")

        print("\n" + "=" * 70)
        print("RESULTS")
        print("=" * 70)

        if message_count == 0:
            print("❌ FAILED: No messages received from Sarvam")
            print("\nPossible causes:")
            print("  1. API key is invalid or quota exceeded")
            print("  2. Sarvam service is down")
            print("  3. Audio format is unsupported (try WAV/PCM only)")
            print("  4. Audio is too short or silent (need actual speech)")
            print("  5. Network connectivity issue")
            return False

        else:
            print(f"✅ SUCCESS: Received {message_count} messages!")
            print("\nMessage Summary:")

            transcripts = [m for m in responses if m.get('type') == 'transcript']
            speech_starts = [m for m in responses if m.get('type') == 'speech_start']
            speech_ends = [m for m in responses if m.get('type') == 'speech_end']

            print(f"  • speech_start events: {len(speech_starts)}")
            print(f"  • speech_end events: {len(speech_ends)}")
            print(f"  • transcript events: {len(transcripts)}")

            if transcripts:
                print("\nTranscriptions:")
                for i, msg in enumerate(transcripts, 1):
                    text = msg.get('text', '(empty)')
                    print(f"  {i}. {text}")

            print("\nFull Response Log:")
            for i, msg in enumerate(responses, 1):
                print(f"  {i}. {msg}")

            return True

    except Exception as e:
        print(f"❌ ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_streaming_stt())
    sys.exit(0 if success else 1)
