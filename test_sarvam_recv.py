#!/usr/bin/env python3
"""Test Sarvam streaming API using recv() instead of async for"""

import asyncio
import base64
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

async def test():
    print("=== Testing Sarvam streaming with recv() ===\n")

    api_key = os.getenv('SARVAMAI_API_KEY')
    from sarvamai import AsyncSarvamAI

    audio_bytes = Path('/app/test_audio.wav').read_bytes()
    audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')

    print(f"Audio: {len(audio_bytes)} bytes (WAV format)\n")

    client = AsyncSarvamAI(api_subscription_key=api_key)

    print("Connecting to Sarvam...")
    async with client.speech_to_text_streaming.connect(
        model='saaras:v3',
        mode='transcribe',
        language_code='en-IN',
        high_vad_sensitivity=True,
        vad_signals=True,
        flush_signal=True,
    ) as ws:
        print('✓ Connected\n')

        print('Sending audio (all at once)...')
        await ws.transcribe(audio=audio_b64, encoding='audio/wav', sample_rate=16000)
        print('✓ Sent\n')

        print('Flushing...')
        await ws.flush()
        print('✓ Flushed\n')

        print('Trying recv() method...')
        try:
            msg = await asyncio.wait_for(ws.recv(), timeout=5)
            print(f'✓ Got message: {msg}')
        except asyncio.TimeoutError:
            print('❌ recv() timed out')
        except Exception as e:
            print(f'❌ recv() error: {e}')

        print('\nTrying async for iteration...')
        count = 0
        try:
            async for msg in asyncio.wait_for(ws.__aiter__(), timeout=5):
                count += 1
                print(f'  {count}. {msg}')
        except asyncio.TimeoutError:
            print(f'  (timeout, got {count} messages)')
        except Exception as e:
            print(f'  Error: {e}')

asyncio.run(test())
