#!/usr/bin/env python3
"""
Test Sarvam Streaming API using the start_listening() method.
This is likely the correct pattern!
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
    print("Testing with start_listening() method")
    print("=" * 70)

    try:
        from sarvamai import AsyncSarvamAI
    except ImportError:
        print("❌ sarvamai not installed")
        return

    client = AsyncSarvamAI(api_subscription_key=SARVAMAI_API_KEY)
    wav_data = create_wav_audio(duration=2)
    wav_b64 = base64.b64encode(wav_data).decode('utf-8')

    # TEST 1: Using start_listening() method
    print("\n" + "─" * 70)
    print("TEST 1: Using start_listening()")
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

            # Start listening
            print("🎧 Calling start_listening()...")
            listen_task = ws.start_listening()
            print("✓ Listener started\n")

            print("📤 Sending audio...")
            await ws.transcribe(audio=wav_b64, encoding="audio/wav", sample_rate=16000)
            print("✓ Sent\n")

            print("🔄 Flushing...")
            await ws.flush()
            print("✓ Flushed\n")

            print("👂 Waiting for responses...\n")

            try:
                # Wait for the listener to complete
                responses = await asyncio.wait_for(listen_task, timeout=5.0)
                if responses:
                    print(f"\n✅ Got {len(responses)} messages:")
                    for i, msg in enumerate(responses, 1):
                        msg_type = msg.get('type')
                        text = msg.get('text', '')
                        print(f"   {i}. {msg_type}: {text}")
                else:
                    print("\n❌ Got 0 messages")

            except asyncio.TimeoutError:
                print("\n❌ Timeout - no messages received")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

    # TEST 2: Using on() callback
    print("\n" + "─" * 70)
    print("TEST 2: Using on() callback")
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

            # Set up callbacks
            def on_message(msg):
                responses.append(msg)
                msg_type = msg.get('type')
                text = msg.get('text', '')
                print(f"   🔔 {msg_type}: {text}")

            def on_error(error):
                print(f"   ❌ Error: {error}")

            print("📍 Setting up callbacks...\n")
            ws.on("message", on_message)
            ws.on("error", on_error)

            print("🎧 Starting listener...\n")
            listen_task = ws.start_listening()

            print("📤 Sending audio...")
            await ws.transcribe(audio=wav_b64, encoding="audio/wav", sample_rate=16000)
            print("✓ Sent\n")

            print("🔄 Flushing...")
            await ws.flush()
            print("✓ Flushed\n")

            print("👂 Waiting for responses...\n")

            try:
                await asyncio.wait_for(listen_task, timeout=5.0)
                if responses:
                    print(f"\n✅ Got {len(responses)} messages")
                else:
                    print(f"\n❌ Got 0 messages")

            except asyncio.TimeoutError:
                print(f"\n⏱️  Timeout ({len(responses)} messages so far)")

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

    print("\n" + "=" * 70)


if __name__ == "__main__":
    asyncio.run(test())
