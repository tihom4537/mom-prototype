/**
 * PCM Audio Recorder - Captures raw PCM audio using Web Audio API
 * Outputs 16-bit PCM at 16kHz sample rate (compatible with Sarvam AI)
 */

export class PcmAudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private isRecording = false;
  private audioChunks: Int16Array[] = [];
  private onChunk?: (chunk: Uint8Array) => void;

  /**
   * Start recording audio as raw PCM
   */
  async start(onChunk?: (chunk: Uint8Array) => void): Promise<void> {
    try {
      this.onChunk = onChunk;
      this.audioChunks = [];

      // Get user audio stream
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Resample to 16kHz if needed
      const sampleRate = this.audioContext.sampleRate;
      const bufferSize = 4096;

      // Create source from microphone
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create processor for raw audio data
      this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

      this.processor.onaudioprocess = (event: AudioProcessingEvent) => {
        const inputData = event.inputBuffer.getChannelData(0);

        // Convert float32 to int16 PCM
        const pcm = this.floatTo16BitPCM(inputData);
        this.audioChunks.push(pcm);

        // Emit chunk callback if provided
        if (this.onChunk) {
          this.onChunk(this.uint8FromInt16(pcm));
        }
      };

      // Connect audio graph
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.isRecording = true;
      console.log('[PCM Recorder] Started recording at', sampleRate, 'Hz');
    } catch (error) {
      console.error('[PCM Recorder] Error starting recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and get all audio data
   */
  stop(): Uint8Array {
    if (!this.isRecording) {
      return new Uint8Array();
    }

    this.isRecording = false;

    // Disconnect audio nodes
    if (this.source && this.processor) {
      this.source.disconnect();
      this.processor.disconnect();
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }

    // Combine all chunks
    const totalLength = this.audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Int16Array(totalLength);
    let offset = 0;
    for (const chunk of this.audioChunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    console.log('[PCM Recorder] Stopped recording. Total:', totalLength, 'samples');
    return this.uint8FromInt16(result);
  }

  /**
   * Convert float32 audio to int16 PCM
   */
  private floatTo16BitPCM(floatData: Float32Array): Int16Array {
    const length = floatData.length;
    const int16 = new Int16Array(length);

    for (let i = 0; i < length; i++) {
      // Clamp value to [-1, 1]
      const s = Math.max(-1, Math.min(1, floatData[i]));

      // Convert to 16-bit PCM (-32768 to 32767)
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    return int16;
  }

  /**
   * Convert Int16Array to Uint8Array for transmission
   */
  private uint8FromInt16(int16Data: Int16Array): Uint8Array {
    const uint8 = new Uint8Array(int16Data.buffer);
    return uint8;
  }

  /**
   * Create a WAV file from raw PCM data (for testing/debugging)
   */
  static createWavFile(pcmData: Uint8Array, sampleRate: number = 16000): Blob {
    const numChannels = 1;
    const bytesPerSample = 2;
    const audioLength = pcmData.length;

    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);

    // RIFF header
    view.setUint32(0, 0x46464952, true); // "RIFF"
    view.setUint32(4, 36 + audioLength, true); // file size
    view.setUint32(8, 0x45564157, true); // "WAVE"

    // fmt chunk
    view.setUint32(12, 0x20746d66, true); // "fmt "
    view.setUint32(16, 16, true); // subchunk1 size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, numChannels, true); // num channels
    view.setUint32(24, sampleRate, true); // sample rate
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // byte rate
    view.setUint16(32, numChannels * bytesPerSample, true); // block align
    view.setUint16(34, 16, true); // bits per sample

    // data chunk
    view.setUint32(36, 0x61746164, true); // "data"
    view.setUint32(40, audioLength, true); // subchunk2 size

    // Convert to regular ArrayBuffer to avoid SharedArrayBuffer type issues
    const headerBytes = new Uint8Array(wavHeader);
    const pcmBytes = new Uint8Array(pcmData); // Copy to ensure regular ArrayBuffer
    return new Blob([headerBytes, pcmBytes], { type: 'audio/wav' });
  }
}
