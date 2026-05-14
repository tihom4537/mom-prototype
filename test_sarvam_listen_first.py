#!/usr/bin/env python3
"""
Test Sarvam Streaming API - try different listening patterns.
Maybe we need to set up the listener BEFORE sending audio?
"""

import asyncio
import base64
import struct
import math

SARVAMAI_API_KEY = 'sk_86w6lw89_8CyDXMtl5JOv4vdVgUeGjdcW'


def create_wav_audio(duration=2):
    """Create simple WAV file."""
    sample_rate = 16000
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
        sample = amplitude * math.sin(2 * math.pi * 500 * t)
        wav_data.extend(struct.pack('<h', int(sample)))

    return bytes(wav_data)


async def test():
    print("=" * 70)
    print("Testing different listening patterns")
    print("=" * 70)

    try:
        from sarvamai import AsyncSarvamAI
    except ImportError:
        print("❌ sarvamai not installed")
        return

    client = AsyncSarvamAI(api_subscription_key=SARVAMAI_API_KEY)
    wav_data = create_wav_audio(duration=2)
    wav_b64 = base64.b64encode(wav_data).decode('utf-8')

    # TEST 1: Concurrent send and listen
    print("\n" + "─" * 70)
    print("TEST 1: Concurrent - send and listen simultaneously")
    print("─" * 70 + "\n")

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

            responses = []

            async def send_audio():
                print("📤 Sending audio...")
                await ws.transcribe(audio=wav_b64, encoding="audio/wav", sample_rate=16000)
                print("✓ Sent\n")

                print("🔄 Flushing...")
                await ws.flush()
                print("✓ Flushed\n")

            async def listen():
                print("👂 Listening (concurrently)...\n")
                async for msg in ws:
                    responses.append(msg)
                    msg_type = msg.get('type')
                    text = msg.get('text', '')
                    print(f"   → {msg_type}: {text}")

            # Run both concurrently
            listen_task = asyncio.create_task(listen())
            await asyncio.sleep(0.5)  # Small delay
            await send_audio()

            try:
                await asyncio.wait_for(listen_task, timeout=5.0)
            except asyncio.TimeoutError:
                print(f"\n   ⏱️  Timeout ({len(responses)} messages)")

        if responses:
            print(f"\n✅ TEST 1: Got {len(responses)} messages")
        else:
            print("\n❌ TEST 1: Got 0 messages")

    except Exception as e:
        print(f"❌ Error: {e}")

    # TEST 2: Send, then try recv() one message at a time
    print("\n" + "─" * 70)
    print("TEST 2: Send then recv() in a loop")
    print("─" * 70 + "\n")

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
            await ws.transcribe(audio=wav_b64, encoding="audio/wav", sample_rate=16000)
            print("✓ Sent\n")

            print("🔄 Flushing...")
            await ws.flush()
            print("✓ Flushed\n")

            print("👂 Trying recv() in a loop...\n")

            responses = []
            for i in range(5):  # Try up to 5 messages
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=2.0)
                    responses.append(msg)
                    print(f"   [{i+1}] {msg.get('type')}: {msg.get('text', '')}")
                except asyncio.TimeoutError:
                    print(f"   [{i+1}] Timeout")
                    break

        if responses:
            print(f"\n✅ TEST 2: Got {len(responses)} messages")
        else:
            print("\n❌ TEST 2: Got 0 messages")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

    # TEST 3: Check if connection object has any special methods
    print("\n" + "─" * 70)
    print("TEST 3: Inspect WebSocket object")
    print("─" * 70 + "\n")

    try:
        async with client.speech_to_text_streaming.connect(
            model="saaras:v3",
            mode="transcribe",
            language_code="en-IN",
        ) as ws:
            print("WebSocket object type:", type(ws))
            print("WebSocket methods/attributes:")
            for attr in dir(ws):
                if not attr.startswith('_'):
                    print(f"  - {attr}")

    except Exception as e:
        print(f"Error: {e}")

    print("\n" + "=" * 70)


if __name__ == "__main__":
    asyncio.run(test())
