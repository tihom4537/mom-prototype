#!/usr/bin/env python3
"""Test Sarvam REST API with correct multipart file upload format"""

import urllib.request
import urllib.error
from pathlib import Path
import io

api_key = "sk_86w6lw89_8CyDXMtl5JOv4vdVgUeGjdcW"
audio_bytes = Path('/app/test_audio.wav').read_bytes()

print("=== Testing Sarvam REST API (multipart file upload) ===\n")
print(f"Audio: {len(audio_bytes)} bytes (WAV)\n")

# Create multipart form data
boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = io.BytesIO()
body.write(f'--{boundary}\r\n'.encode())
body.write(b'Content-Disposition: form-data; name="file"; filename="audio.wav"\r\n')
body.write(b'Content-Type: audio/wav\r\n\r\n')
body.write(audio_bytes)
body.write(f'\r\n--{boundary}\r\n'.encode())
body.write(b'Content-Disposition: form-data; name="language_code"\r\n\r\n')
body.write(b'en-IN\r\n')
body.write(f'--{boundary}\r\n'.encode())
body.write(b'Content-Disposition: form-data; name="model"\r\n\r\n')
body.write(b'saaras:v3\r\n')
body.write(f'--{boundary}--\r\n'.encode())

data = body.getvalue()

print("Sending multipart request...")
try:
    req = urllib.request.Request(
        'https://api.sarvam.ai/speech-to-text',
        data=data,
        headers={
            'api-subscription-key': api_key,
            f'Content-Type': f'multipart/form-data; boundary={boundary}'
        }
    )

    with urllib.request.urlopen(req, timeout=30) as response:
        status = response.status
        body_text = response.read().decode('utf-8')
        print(f'Status: {status}')
        print(f'Response:\n{body_text}\n')

        if status == 200:
            print('✅ REST API WORKS! Transcription successful.')
        else:
            print(f'Got status {status}')

except urllib.error.HTTPError as e:
    print(f'HTTP Error {e.code}: {e.reason}')
    try:
        error_msg = e.read().decode('utf-8')
        print(f'Response: {error_msg}')
    except:
        pass
except urllib.error.URLError as e:
    print(f'❌ Connection error: {e.reason}')
except Exception as e:
    print(f'❌ Error: {type(e).__name__}: {e}')
