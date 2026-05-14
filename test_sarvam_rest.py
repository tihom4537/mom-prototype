#!/usr/bin/env python3
"""Test Sarvam REST API to verify API key works"""

import urllib.request
import urllib.error
import json
import base64
from pathlib import Path

api_key = "sk_86w6lw89_8CyDXMtl5JOv4vdVgUeGjdcW"
audio_bytes = Path('/app/test_audio.wav').read_bytes()
audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')

print("=== Testing Sarvam REST API (non-streaming) ===\n")
print(f"Audio: {len(audio_bytes)} bytes")
print(f"API Key: {api_key[:20]}...\n")

print("Sending request to https://api.sarvam.ai/speech-to-text")
try:
    url = 'https://api.sarvam.ai/speech-to-text'
    data = json.dumps({
        'audio': audio_b64,
        'language_code': 'en-IN',
        'model': 'saaras:v3'
    }).encode('utf-8')

    req = urllib.request.Request(
        url,
        data=data,
        headers={
            'api-subscription-key': api_key,
            'Content-Type': 'application/json'
        }
    )

    with urllib.request.urlopen(req, timeout=30) as response:
        status = response.status
        body = response.read().decode('utf-8')
        print(f'Status: {status}')
        print(f'Response:\n{body}\n')
        print('✅ REST API works! API key is valid.')

except urllib.error.HTTPError as e:
    print(f'HTTP Error {e.code}: {e.reason}')
    print(f'Response: {e.read().decode("utf-8")[:200]}')
except urllib.error.URLError as e:
    print(f'❌ Connection error: {e.reason}')
except Exception as e:
    print(f'❌ Error: {type(e).__name__}: {e}')
