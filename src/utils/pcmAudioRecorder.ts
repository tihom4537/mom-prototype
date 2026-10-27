/**
 * PCM Audio Recorder — captures the microphone as raw 16 kHz mono 16-bit PCM,
 * which is exactly what the streaming STT endpoint (`/ws/speech-to-text`) expects.
 *
 * Capture runs in an AudioWorklet (falls back to ScriptProcessorNode on old
 * browsers). The device sample rate (usually 44.1/48 kHz) is box-filter
 * resampled to 16 kHz on the audio thread, and 100 ms chunks are handed to the
 * `onChunk` callback as they are produced so they can be streamed live.
 *
 *   const rec = new PcmAudioRecorder();
 *   await rec.start(chunk => ws.send(chunk));   // chunk: Uint8Array of Int16 LE PCM
 *   rec.analyser                                 // AnalyserNode for a waveform UI
 *   const wav = rec.stop();                       // whole recording as a WAV file
 */

export const PCM_SAMPLE_RATE = 16000;
const CHUNK_SAMPLES = 1600; // 100 ms at 16 kHz

// Runs on the audio thread: resample to 16 kHz and post 100 ms Int16 chunks.
const WORKLET_SOURCE = `
class PcmCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buf = new Int16Array(${CHUNK_SAMPLES});
    this.n = 0; this.sum = 0; this.cnt = 0; this.phase = 0;
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    for (let i = 0; i < ch.length; i++) {
      this.sum += ch[i]; this.cnt++; this.phase += ${PCM_SAMPLE_RATE};
      if (this.phase >= sampleRate) {
        this.phase -= sampleRate;
        const s = Math.max(-1, Math.min(1, this.sum / this.cnt));
        this.buf[this.n++] = s < 0 ? s * 0x8000 : s * 0x7fff;
        this.sum = 0; this.cnt = 0;
        if (this.n === this.buf.length) {
          this.port.postMessage(this.buf.buffer.slice(0));
          this.n = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor("pcm-capture", PcmCapture);
`;

export class PcmAudioRecorder {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private isRecording = false;
  private audioChunks: Int16Array[] = [];
  private onChunk?: (chunk: Uint8Array) => void;

  /** AnalyserNode on the live microphone signal (for waveform visualisers). */
  analyser: AnalyserNode | null = null;

  /**
   * Start recording. `onChunk` receives 100 ms chunks of 16 kHz Int16 PCM
   * (as Uint8Array) as soon as they are captured.
   * Pass an existing MediaStream to reuse a permission the caller already got.
   */
  async start(onChunk?: (chunk: Uint8Array) => void, stream?: MediaStream): Promise<void> {
    this.onChunk = onChunk;
    this.audioChunks = [];

    this.mediaStream = stream ?? (await navigator.mediaDevices.getUserMedia({ audio: true }));

    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new Ctx();
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume().catch(() => {});
    }

    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 64;
    this.source.connect(this.analyser);

    const onPcm = (pcm: Int16Array) => {
      if (!this.isRecording) return;
      this.audioChunks.push(pcm);
      this.onChunk?.(new Uint8Array(pcm.buffer, pcm.byteOffset, pcm.byteLength));
    };

    if (this.audioContext.audioWorklet) {
      const blob = new Blob([WORKLET_SOURCE], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      try {
        await this.audioContext.audioWorklet.addModule(url);
      } finally {
        URL.revokeObjectURL(url);
      }
      this.workletNode = new AudioWorkletNode(this.audioContext, 'pcm-capture');
      this.workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        onPcm(new Int16Array(event.data));
      };
      this.source.connect(this.workletNode);
      // A worklet with no output connection is still driven by the graph in
      // every current browser, but Safari historically needed a sink.
      this.workletNode.connect(this.audioContext.destination);
    } else {
      // Legacy fallback: resample on the main thread.
      const inRate = this.audioContext.sampleRate;
      let phase = 0, sum = 0, cnt = 0;
      let pending: number[] = [];
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.processor.onaudioprocess = (event: AudioProcessingEvent) => {
        const input = event.inputBuffer.getChannelData(0);
        for (let i = 0; i < input.length; i++) {
          sum += input[i]; cnt++; phase += PCM_SAMPLE_RATE;
          if (phase >= inRate) {
            phase -= inRate;
            const s = Math.max(-1, Math.min(1, sum / cnt));
            pending.push(s < 0 ? s * 0x8000 : s * 0x7fff);
            sum = 0; cnt = 0;
            if (pending.length === CHUNK_SAMPLES) {
              onPcm(Int16Array.from(pending));
              pending = [];
            }
          }
        }
      };
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    }

    this.isRecording = true;
    console.log('[PCM Recorder] Started at', this.audioContext.sampleRate, 'Hz, streaming', PCM_SAMPLE_RATE, 'Hz PCM');
  }

  /** True while the microphone is open. */
  recording(): boolean {
    return this.isRecording;
  }

  /**
   * Stop recording, release the microphone, and return the whole recording as
   * a 16 kHz mono WAV file (empty array if nothing was recorded).
   */
  stop(): Uint8Array {
    if (!this.isRecording) {
      return new Uint8Array();
    }
    this.isRecording = false;

    try { this.source?.disconnect(); } catch { /* already gone */ }
    try { this.workletNode?.disconnect(); } catch { /* already gone */ }
    try { this.processor?.disconnect(); } catch { /* already gone */ }
    if (this.workletNode) this.workletNode.port.onmessage = null;
    this.audioContext?.close().catch(() => {});
    this.mediaStream?.getTracks().forEach(track => track.stop());

    this.source = null;
    this.workletNode = null;
    this.processor = null;
    this.analyser = null;
    this.audioContext = null;
    this.mediaStream = null;

    const totalLength = this.audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Int16Array(totalLength);
    let offset = 0;
    for (const chunk of this.audioChunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    this.audioChunks = [];

    const pcmData = new Uint8Array(result.buffer);
    console.log('[PCM Recorder] Stopped. Total:', totalLength, 'samples');
    return totalLength ? this.createWavFromPcm(pcmData, PCM_SAMPLE_RATE, 1, 16) : new Uint8Array();
  }

  /**
   * Create WAV file from raw PCM data
   */
  private createWavFromPcm(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: number): Uint8Array {
    const bytesPerSample = bitsPerSample / 8;
    const dataLength = pcmData.length;
    const fileLength = 36 + dataLength;

    const wav = new ArrayBuffer(44 + dataLength);
    const view = new DataView(wav);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, fileLength, true);
    writeString(8, 'WAVE');

    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // sub-chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // byte rate
    view.setUint16(32, numChannels * bytesPerSample, true); // block align
    view.setUint16(34, bitsPerSample, true);

    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    const uint8View = new Uint8Array(wav);
    uint8View.set(pcmData, 44);
    return uint8View;
  }

  /**
   * Create a WAV file (Blob) from raw PCM data — for testing/debugging.
   */
  static createWavFile(pcmData: Uint8Array, sampleRate: number = PCM_SAMPLE_RATE): Blob {
    const numChannels = 1;
    const bytesPerSample = 2;
    const audioLength = pcmData.length;

    const wavHeader = new ArrayBuffer(44);
    const view = new DataView(wavHeader);

    view.setUint32(0, 0x46464952, true); // "RIFF"
    view.setUint32(4, 36 + audioLength, true);
    view.setUint32(8, 0x45564157, true); // "WAVE"
    view.setUint32(12, 0x20746d66, true); // "fmt "
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true);
    view.setUint16(32, numChannels * bytesPerSample, true);
    view.setUint16(34, 16, true);
    view.setUint32(36, 0x61746164, true); // "data"
    view.setUint32(40, audioLength, true);

    const headerBytes = new Uint8Array(wavHeader);
    const pcmBytes = new Uint8Array(pcmData);
    return new Blob([headerBytes, pcmBytes], { type: 'audio/wav' });
  }
}
