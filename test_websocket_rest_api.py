#!/usr/bin/env python3
"""
Test the new WebSocket endpoint using REST API fallback.
"""

import asyncio
import websockets
import json
import base64
import struct
import math

BACKEND_URL = "wss://aahaninternational.site/ws/speech-to-text?locale=en"


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
    print("Testing WebSocket STT Endpoint (REST API Fallback)")
    print("=" * 70)
    print(f"URL: {BACKEND_URL}\n")

    try:
        async with websockets.connect(BACKEND_URL) as websocket:
            print("✓ Connected to WebSocket\n")

            # Create and send audio
            audio = create_wav_audio(duration=2)
            print(f"📤 Sending audio ({len(audio)} bytes)...\n")

            # Send binary audio in chunks
            chunk_size = 4096
            for i in range(0, len(audio), chunk_size):
                chunk = audio[i:i+chunk_size]
                await websocket.send(chunk)

            # Signal end of audio
            print("📍 Sending end signal...")
            await websocket.send(json.dumps({"type": "end"}))
            print("✓ Sent\n")

            # Receive responses
            print("👂 Waiting for response...\n")
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                msg = json.loads(response)

                msg_type = msg.get('type')
                if msg_type == 'transcript':
                    text = msg.get('text', '')
                    print(f"✅ SUCCESS!")
                    print(f"   Type: {msg_type}")
                    print(f"   Transcript: {text if text else '(empty - expected for tone audio)'}")
                    print(f"\n✓ WebSocket STT endpoint with REST API fallback is WORKING!")

                elif msg_type == 'error':
                    print(f"❌ Error: {msg.get('message')}")

                else:
                    print(f"Received: {msg}")

            except asyncio.TimeoutError:
                print("❌ Timeout - no response received")

    except Exception as e:
        print(f"❌ Error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test())
