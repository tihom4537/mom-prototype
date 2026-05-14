# Sarvam Streaming Speech-to-Text API Testing Guide

## Overview

This guide helps test the Sarvam streaming WebSocket API with actual speech audio to diagnose why it may not be returning transcript messages.

## Test Scripts

### 1. `test_sarvam_streaming_with_speech.py`
**Most detailed test with synthetic speech audio**

Creates a speech-like audio waveform and sends it to Sarvam streaming API.

```bash
# Local test
python test_sarvam_streaming_with_speech.py

# With custom audio file
python test_sarvam_streaming_with_speech.py /path/to/audio.wav

# With different language
python test_sarvam_streaming_with_speech.py /path/to/audio.wav kn-IN
```

**What it tests:**
- ✅ Streaming API connection with proper parameters
- ✅ Audio encoding (base64)
- ✅ Buffer flushing
- ✅ Message types: `speech_start`, `speech_end`, `transcript`
- ✅ Timeout handling
- ✅ Error messages

### 2. `test_sarvam_with_real_sample.py`
**Attempts to download real speech sample, falls back to synthesis**

```bash
python test_sarvam_with_real_sample.py
python test_sarvam_with_real_sample.py en-IN
python test_sarvam_with_real_sample.py kn-IN
```

## Server Testing Instructions

### Step 1: SSH to Server
```bash
ssh -i ~/Downloads/mom-prototype.pem ubuntu@13.201.1.241
```

### Step 2: Navigate to Project
```bash
cd /home/ubuntu/mom-prototype/mom-prototype
```

### Step 3: Source Environment
```bash
source ~/.env
echo $SARVAMAI_API_KEY  # Verify API key is set
```

### Step 4: Run Tests

**Quick test with built-in speech:**
```bash
python test_sarvam_streaming_with_speech.py 2>&1 | tee test_output.log
```

**Test with real sample (if available):**
```bash
python test_sarvam_with_real_sample.py en-IN 2>&1 | tee test_output.log
```

### Step 5: Review Output

Expected **SUCCESS** output:
```
✅ SUCCESS: Received X messages!

Message Summary:
  • speech_start events: 1
  • speech_end events: 1
  • transcript events: 1

Transcriptions:
  1. <actual speech text>
```

Expected **FAILURE** output (what we've been seeing):
```
❌ FAILED: No messages received from Sarvam

Possible causes:
  1. API key is invalid or quota exceeded
  2. Sarvam service is down
  3. Audio format is unsupported (try WAV/PCM only)
  4. Audio is too short or silent (need actual speech)
  5. Network connectivity issue
```

## API Documentation Reference

Based on the official Sarvam API docs, the streaming API should:

1. **Support these audio formats only:**
   - WAV (`audio/wav`)
   - Raw PCM (`pcm_s16le`, `pcm_l16`, `pcm_raw`)

2. **Require proper parameters:**
   ```python
   async with client.speech_to_text_streaming.connect(
       model="saaras:v3",           # Required
       mode="transcribe",            # Required (transcribe|translate|verbatim|translit|codemix)
       language_code="en-IN",        # Required for STT
       high_vad_sensitivity=True,    # Recommended
       vad_signals=True,             # Gets speech_start/end events
       flush_signal=True,            # Enable manual flush
   ) as ws:
   ```

3. **Return these message types:**
   - `{"type": "speech_start"}` - Voice activity detected
   - `{"type": "speech_end"}` - Voice activity stopped
   - `{"type": "transcript", "text": "..."}` - Final result

## Troubleshooting

### If streaming API returns 0 messages:

1. **Verify API key:**
   ```bash
   python test_sarvam_rest.py  # This should work
   ```
   If REST API works but streaming doesn't → API is valid, streaming API has issue

2. **Check audio format:**
   - Must be WAV or raw PCM
   - Sample rate: 16kHz (recommended) or 8kHz
   - Duration: At least 1-2 seconds of actual speech

3. **Check network:**
   ```bash
   curl -i https://api.sarvam.ai/speech-to-text
   ```

4. **Try direct sarvamai SDK test:**
   ```python
   from sarvamai import AsyncSarvamAI
   import asyncio
   
   async def test():
       client = AsyncSarvamAI(api_subscription_key="YOUR_KEY")
       async with client.speech_to_text_streaming.connect(
           model="saaras:v3",
           mode="transcribe",
           language_code="en-IN"
       ) as ws:
           print("Connected!")
   
   asyncio.run(test())
   ```

## Next Steps

Based on test results:

### ✅ If Streaming Works:
1. Revert `speech_to_text_streaming.py` to use streaming API
2. Verify frontend audio format (should be WAV not WebM)
3. Test end-to-end with browser recording

### ❌ If Streaming Fails:
1. Modify `speech_to_text_streaming.py` to use REST API fallback
2. Accumulate audio chunks, then call REST endpoint when done
3. Return transcript via WebSocket to client
4. This maintains real-time appearance for user while using working REST API

## Files to Check

- `FASTAPI-MoM/gram_panchayat_api/speech_to_text_streaming.py` - Main WebSocket handler
- `FASTAPI-MoM/gram_panchayat_api/speech_to_text.py` - REST API (proven working)
- `test_sarvam_rest.py` - REST API test (for comparison)

## Quick Status Check

```bash
# 1. Check backend is running
curl -i http://localhost:8000/docs

# 2. Check API key is loaded
docker logs mom-backend | grep SARVAMAI

# 3. Run streaming test
python test_sarvam_streaming_with_speech.py

# 4. Compare with REST test  
python test_sarvam_rest.py
```

If REST works but streaming fails → use REST fallback in WebSocket handler.
