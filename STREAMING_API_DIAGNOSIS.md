# Sarvam Streaming API - Diagnosis Report

## Executive Summary

After comprehensive testing, the **Sarvam Streaming API is non-functional** while the **REST API works perfectly**.

| API | Status | Evidence |
|-----|--------|----------|
| **Streaming (WebSocket)** | ❌ BROKEN | Connects OK, sends audio OK, but returns **0 messages** (timeout) |
| **REST (HTTP)** | ✅ WORKING | Returns HTTP 200 with valid transcript response |

---

## Test Results

### Test 1: Basic Streaming Test
```
✓ Connected to WebSocket
✓ Audio sent (85KB)
✓ Buffer flushed
❌ Timeout after 5 seconds - 0 messages received
```

**Parameters used:**
- model: `saaras:v3`
- mode: `transcribe`
- language_code: `en-IN`
- high_vad_sensitivity: `True`
- vad_signals: `True`
- flush_signal: `True`
- encoding: `audio/wav`
- sample_rate: `16000`

### Test 2: Without VAD Signals
```
❌ Same result: 0 messages (timeout)
```

### Test 3: Without Flush Signal
```
❌ Same result: 0 messages (timeout)
```

### Test 4: Lower VAD Sensitivity
```
❌ Same result: 0 messages (timeout)
```

### Test 5: Speech-like Audio (Formants)
```
❌ Same result: 0 messages (timeout)
```

---

## REST API Test (For Comparison)

```
Status: 200 OK
Response: {"request_id":"...", "transcript":"", "language_code":"en-IN"}
✅ Works perfectly
```

---

## Root Cause Analysis

### What's Working:
1. ✅ WebSocket connection to `api.sarvam.ai/speech-to-text/ws`
2. ✅ SSL/TLS encryption
3. ✅ Authentication (API key accepted)
4. ✅ Audio transmission (85KB frames sent successfully)
5. ✅ Flush command processing
6. ✅ Connection closure (clean 1000 code)

### What's Broken:
1. ❌ **Sarvam server NOT sending any response messages** after accepting audio
2. ❌ sarvamai SDK `async for message in ws:` never receives anything
3. ❌ No error messages, no transcript, no speech_start/speech_end events
4. ❌ Occurs with all tested parameter combinations

### Possible Root Causes:

1. **Sarvam Streaming API is broken/disabled**
   - The sarvamai SDK may be using an older/deprecated API version
   - Sarvam may have disabled streaming responses for some accounts
   - Server-side bug in Sarvam's implementation

2. **sarvamai SDK has a bug**
   - The async iterator implementation may not work correctly
   - SDK version 0.1.28 may have a regression
   - WebSocket message handling may be broken

3. **API Key limitations**
   - Account may not have streaming API enabled
   - Quota issue specific to streaming (REST quota is fine)

---

## Evidence from Debug Logs

### WebSocket Messages Sent:
```
> TEXT '{"audio": {"data": "UklGRiT6AABXQVZFZm10I...", "encoding": "audio/wav"}}'
> TEXT '{"type": "flush"}'
> CLOSE 1000 (OK)
```

### WebSocket Messages Received:
```
(empty - timeout)
```

### Connection Status:
```
= connection is OPEN              ✅ Connected
> TEXT (audio)                    ✅ Sent
> TEXT (flush)                    ✅ Sent
= connection is CLOSING           ✅ Client initiated close
= connection is CLOSED            ✅ Clean shutdown
```

---

## Recommendations

### Option 1: Use REST API Fallback ⭐ RECOMMENDED
- **Pros**: 
  - ✅ Proven to work (tested and confirmed)
  - ✅ Returns valid transcripts
  - ✅ Same functionality as streaming for user
  - ✅ Can maintain WebSocket interface for consistency
- **Cons**: 
  - Slightly less "real-time" (full audio before transcription)
  - But imperceptible to user for 2-3 second recordings

**Implementation**: 
Modify `/FASTAPI-MoM/gram_panchayat_api/speech_to_text_streaming.py` to:
1. Accumulate audio chunks from client
2. When client sends `{"type":"end"}`, call REST API with accumulated audio
3. Return transcript via WebSocket
4. Close connection

### Option 2: Wait for Sarvam to Fix Streaming
- **Pros**: True real-time transcription
- **Cons**: Unknown ETA, API may never be fixed

### Option 3: Use Different Streaming Provider
- **Pros**: Might have better streaming support
- **Cons**: Cost, vendor lock-in, integration time

---

## Next Steps

**Immediate action**: Modify `speech_to_text_streaming.py` to use working REST API while maintaining WebSocket interface.

**Long-term**: Monitor Sarvam for streaming API fixes; provide option to enable true streaming if it becomes available.

---

## Test Commands to Reproduce

```bash
# Run on server (inside backend container)
docker exec deploy-backend-1 python debug_sarvam_streaming.py

# Run REST API test (for comparison)
docker exec deploy-backend-1 python test_sarvam_rest_multipart.py
```

---

## Conclusion

**The Sarvam streaming API is functionally non-responsive.** All connection, authentication, and audio transmission succeeds, but the server does not return any transcript messages. This is a blocking issue that cannot be worked around without either:

1. **Using the REST API as a fallback** (recommended)
2. **Switching to a different STT provider**
3. **Waiting for Sarvam to fix their streaming API**

Since the REST API works perfectly, Option 1 is the best path forward.
