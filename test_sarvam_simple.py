#!/usr/bin/env python3
"""Test Sarvam: send all audio at once like the docs example."""

import asyncio
import base64
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

async def test():
    print("=== Testing Sarvam: Send all audio at once ===")

    api_key = os.getenv('SARVAMAI_API_KEY')
    audio_file = Path('/app/test_audio.wav')
    if not audio_file.exists():
        print(f"❌ Audio file not found")
        return

    audio_bytes = audio_file.read_bytes()
    audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')

    print(f"Audio: {len(audio_bytes)} bytes")

    from sarvamai import AsyncSarvamAI
    client = AsyncSarvamAI(api_subscription_key=api_key)

    print("Connecting...")
    async with client.speech_to_text_streaming.connect(
        model='saaras:v3',
        mode='transcribe',
        language_code='en-IN',
        high_vad_sensitivity=True,
        vad_signals=True,
        flush_signal=True,
    ) as ws:
        print('Connected! Sending all audio at once...')
        await ws.transcribe(audio=audio_b64, encoding='audio/wav', sample_rate=16000)

        print('Flushing...')
        try:
            await ws.flush()
            print('Flush called successfully')
        except Exception as e:
            print(f'Flush error: {e}')

        print('Waiting for responses...')
        count = 0
        try:
            async for msg in asyncio.wait_for(ws.__aiter__(), timeout=5):
                count += 1
                print(f'  ✓ Message {count}: {msg}')
        except asyncio.TimeoutError:
            print(f'  Timeout (got {count} messages)')
        except Exception as e:
            print(f'  Error: {e}')

        if count == 0:
            print('Trying alternative: recv()...')
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=5)
                print(f'  ✓ Got: {msg}')
            except asyncio.TimeoutError:
                print('  recv() timeout')
            except Exception as e:
                print(f'  recv() error: {e}')

asyncio.run(test())
