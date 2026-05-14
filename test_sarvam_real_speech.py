#!/usr/bin/env python3
"""Test Sarvam API with real speech audio (all at once, not chunked)."""

import asyncio
import base64
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

async def test():
    print("=== Testing Sarvam with REAL SPEECH audio ===\n")

    api_key = os.getenv('SARVAMAI_API_KEY')
    if not api_key:
        print("❌ SARVAMAI_API_KEY not set")
        return

    from sarvamai import AsyncSarvamAI

    # Use test_audio.wav (the 440Hz tone we generated)
    # OR download a real speech sample
    audio_file = Path('/app/test_audio.wav')
    if not audio_file.exists():
        print(f"❌ {audio_file} not found")
        print("Creating test audio...")
        import struct, math
        def generate_wav(filename):
            sample_rate = 16000
            duration = 2
            num_samples = sample_rate * duration
            with open(filename, 'wb') as f:
                # WAV header
                f.write(b'RIFF')
                f.write(struct.pack('<I', 36 + num_samples * 2))
                f.write(b'WAVE')
                f.write(b'fmt ')
                f.write(struct.pack('<I', 16))
                f.write(struct.pack('<H', 1))  # PCM
                f.write(struct.pack('<H', 1))  # mono
                f.write(struct.pack('<I', sample_rate))
                f.write(struct.pack('<I', sample_rate * 2))
                f.write(struct.pack('<H', 2))
                f.write(struct.pack('<H', 16))
                f.write(b'data')
                f.write(struct.pack('<I', num_samples * 2))

                amplitude = 32767
                for i in range(num_samples):
                    sample = amplitude * math.sin(2 * math.pi * 440 * i / sample_rate)
                    f.write(struct.pack('<h', int(sample)))

        generate_wav(str(audio_file))
        print(f"Created {audio_file}")

    audio_bytes = audio_file.read_bytes()
    audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')

    print(f"Audio file: {len(audio_bytes)} bytes")
    print(f"Format: WAV (should be compatible with Sarvam)\n")

    client = AsyncSarvamAI(api_subscription_key=api_key)

    print("Connecting to Sarvam streaming API...")
    async with client.speech_to_text_streaming.connect(
        model='saaras:v3',
        mode='transcribe',
        language_code='en-IN',
        high_vad_sensitivity=True,
        vad_signals=True,
        flush_signal=True,
    ) as ws:
        print('✓ Connected\n')
        print('Sending audio...')
        await ws.transcribe(audio=audio_b64, encoding='audio/wav', sample_rate=16000)

        print('Flushing buffer...')
        await ws.flush()
        print('✓ Flushed\n')

        print('Waiting for Sarvam responses...')
        responses = []
        try:
            async def collect():
                async for msg in ws:
                    responses.append(msg)
                    msg_type = msg.get('type', 'unknown')
                    text = msg.get('text', '')
                    print(f'  ✓ {msg_type}: {text}')

            await asyncio.wait_for(collect(), timeout=10.0)
        except asyncio.TimeoutError:
            print(f'  ⏱️  Timeout (got {len(responses)} messages)\n')

        if responses:
            print(f'\n✅ SUCCESS! Got {len(responses)} messages from Sarvam')
            for i, msg in enumerate(responses):
                print(f'  {i+1}. {msg}')
        else:
            print('\n❌ FAILED: No responses from Sarvam (even after flush)')
            print('\nPossible issues:')
            print('  1. Sarvam API key is invalid or quota exceeded')
            print('  2. Sarvam service is down')
            print('  3. Audio format/encoding is wrong')
            print('  4. The stream needs actual speech, not a tone')

asyncio.run(test())
