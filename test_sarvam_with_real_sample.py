#!/usr/bin/env python3
"""
Test Sarvam Streaming API with actual speech sample from GitHub.
Downloads a sample English speech audio file from Sarvam's cookbook.

Usage:
    python test_sarvam_with_real_sample.py
    python test_sarvam_with_real_sample.py en-IN    # English
    python test_sarvam_with_real_sample.py kn-IN    # Kannada (if available)
"""

import asyncio
import base64
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()


async def test_with_real_sample():
    api_key = os.getenv('SARVAMAI_API_KEY')
    if not api_key:
        print("❌ ERROR: SARVAMAI_API_KEY not set")
        return False

    language_code = sys.argv[1] if len(sys.argv) > 1 else "en-IN"

    print("=" * 70)
    print("Testing Sarvam Streaming API with Real Speech Sample")
    print("=" * 70)

    # Try to download a sample audio file
    # Using a known working WAV file (English speech)
    sample_urls = [
        # Sarvam's GitHub cookbook (may or may not exist)
        "https://raw.githubusercontent.com/sarvamai/sarvam-ai-cookbook/main/sample_data/stt/english_sample.wav",
        # Alternative: Mozilla Common Voice sample (English)
        "https://voice-prod-bundler-ee.herokuapp.com/download?path=common_voice_en_25747_google.mp3",
    ]

    audio_bytes = None
    audio_file = Path('/tmp/sample_speech.wav')

    # Try downloading
    for url in sample_urls:
        print(f"\n📥 Trying to download from: {url}")
        try:
            print("   Downloading...")
            with urllib.request.urlopen(url, timeout=10) as response:
                audio_bytes = response.read()
                if len(audio_bytes) > 1000:  # At least 1KB
                    print(f"   ✓ Downloaded {len(audio_bytes)} bytes")
                    break
        except (urllib.error.URLError, urllib.error.HTTPError) as e:
            print(f"   ✗ Failed: {e}")
        except Exception as e:
            print(f"   ✗ Error: {e}")

    # If download failed, create synthetic speech-like audio
    if not audio_bytes:
        print("\n📝 Creating synthetic speech audio...")
        import struct
        import math

        sample_rate = 16000
        duration = 3  # 3 seconds
        num_samples = sample_rate * duration

        # Create WAV in memory
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

        # Speech-like audio with multiple formants
        amplitude = 32767 * 0.7
        for i in range(num_samples):
            t = i / sample_rate

            # Simulate vowel sounds with formant frequencies
            # Different vowels at different times
            if t < 1.0:  # "aaa" sound
                f1, f2, f3 = 700, 1220, 2600
            elif t < 2.0:  # "eee" sound
                f1, f2, f3 = 250, 2000, 2800
            else:  # "iii" sound
                f1, f2, f3 = 300, 2700, 3900

            # Add slow modulation
            f1 += 50 * math.sin(2 * math.pi * 0.5 * t)
            f2 += 100 * math.sin(2 * math.pi * 0.3 * t)

            # Mix formants with different amplitudes
            sample = (
                0.6 * amplitude * math.sin(2 * math.pi * f1 * t) +
                0.3 * amplitude * math.sin(2 * math.pi * f2 * t) +
                0.1 * amplitude * math.sin(2 * math.pi * f3 * t)
            )

            # Envelope
            if t < 0.2:
                envelope = t / 0.2
            elif t > 2.8:
                envelope = (3.0 - t) / 0.2
            else:
                envelope = 1.0

            sample *= envelope

            # Add a bit of noise for realism
            import random
            sample += random.gauss(0, amplitude * 0.01)

            wav_data.extend(struct.pack('<h', int(max(-32768, min(32767, sample)))))

        audio_bytes = bytes(wav_data)
        print(f"   ✓ Created {len(audio_bytes)} bytes of synthetic speech")

    # Save to file
    with open(audio_file, 'wb') as f:
        f.write(audio_bytes)

    audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')

    print(f"\n📊 Audio Info:")
    print(f"   Size: {len(audio_bytes)} bytes ({len(audio_bytes) / 1024:.1f} KB)")
    print(f"   Language: {language_code}")
    print(f"   Saved to: {audio_file}")

    # Import and test
    try:
        from sarvamai import AsyncSarvamAI
    except ImportError:
        print("❌ sarvamai SDK not installed")
        return False

    client = AsyncSarvamAI(api_subscription_key=api_key)

    print("\n" + "=" * 70)
    print("🔌 Testing Streaming Connection...")
    print("=" * 70 + "\n")

    try:
        async with client.speech_to_text_streaming.connect(
            model="saaras:v3",
            mode="transcribe",
            language_code=language_code,
            high_vad_sensitivity=True,
            vad_signals=True,
            flush_signal=True,
        ) as ws:
            print("✓ WebSocket connected\n")

            print("📤 Sending audio...")
            await ws.transcribe(
                audio=audio_b64,
                encoding="audio/wav",
                sample_rate=16000,
            )
            print("✓ Audio sent\n")

            print("🔄 Flushing...")
            await ws.flush()
            print("✓ Flushed\n")

            print("👂 Listening for responses...\n")

            responses = []
            try:
                async def listen():
                    async for msg in ws:
                        responses.append(msg)
                        msg_type = msg.get('type', 'unknown')
                        if msg_type == 'speech_start':
                            print("   🎤 Speech detected")
                        elif msg_type == 'speech_end':
                            print("   🛑 Speech ended")
                        elif msg_type == 'transcript':
                            text = msg.get('text', '')
                            print(f"   📝 Transcript: {text}")
                        else:
                            print(f"   ℹ️  {msg_type}: {msg}")

                await asyncio.wait_for(listen(), timeout=10.0)

            except asyncio.TimeoutError:
                print(f"\n⏱️  Timeout (received {len(responses)} messages)")

        print("\n" + "=" * 70)
        if responses:
            print(f"✅ SUCCESS: Got {len(responses)} messages")
            print("=" * 70)
            for i, msg in enumerate(responses, 1):
                print(f"{i}. {msg}")
            return True
        else:
            print("❌ FAILED: No response messages")
            print("=" * 70)
            print("\nPossible issues:")
            print("  • API key invalid or quota exceeded")
            print("  • Sarvam service down")
            print("  • Audio format unsupported")
            print("  • Network issue")
            return False

    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = asyncio.run(test_with_real_sample())
    sys.exit(0 if success else 1)
