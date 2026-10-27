/**
 * Live (streaming) speech-to-text for a text field.
 *
 * Opens the microphone and the `/ws/speech-to-text` WebSocket together,
 * streams 16 kHz PCM as it is captured, and reports the transcript as it
 * grows: `committed` is the text of all finished utterances, `partial` is
 * the in-progress utterance that may still change.
 *
 *   const base = currentFieldText;
 *   const session = await startLiveTranscription({
 *     locale: lang,
 *     onText: (committed, partial) => setField(joinText(base, committed, partial)),
 *     onError: msg => setError(msg),
 *   });
 *   analyserRef.current = session.analyser;   // optional waveform
 *   ...
 *   await session.stop();   // user pressed stop: flushes the last utterance
 *   // or session.cancel(); // user discarded the recording
 */

import { PcmAudioRecorder } from './pcmAudioRecorder';
import { WebSocketSTTClient, type SttModel } from './websocketSttClient';

export interface LiveTranscriptionOptions {
  locale: string;
  /** Called on every transcript change with the full session text so far. */
  onText: (committed: string, partial: string) => void;
  onError?: (message: string) => void;
  /** Called once the server has accepted the stream. */
  onReady?: () => void;
  model?: SttModel;
  keyterms?: string[];
  /** Reuse a MediaStream the caller already obtained (e.g. for a permission check). */
  stream?: MediaStream;
}

export interface LiveTranscriptionSession {
  /** Live microphone analyser for waveform visualisers. */
  analyser: AnalyserNode | null;
  /** Stop the microphone, flush the final utterance, close the socket. */
  stop(): Promise<void>;
  /** Abort immediately; no further `onText` calls. */
  cancel(): void;
  /** Text of all finished utterances so far. */
  committedText(): string;
}

/** Join pieces of text with single spaces, skipping empties. */
export function joinText(...parts: Array<string | undefined | null>): string {
  return parts.map(p => (p ?? '').trim()).filter(Boolean).join(' ');
}

/** Friendly message for a getUserMedia failure. */
export function microphoneErrorMessage(err: unknown): string {
  if (!navigator.mediaDevices?.getUserMedia) {
    return 'Microphone is not available. This feature requires a secure (HTTPS) connection.';
  }
  const notAllowed = err instanceof DOMException && err.name === 'NotAllowedError';
  return notAllowed
    ? 'Microphone access was denied. Please allow microphone access in your browser settings and try again.'
    : 'Could not access the microphone. Please check your browser permissions and try again.';
}

export async function startLiveTranscription(opts: LiveTranscriptionOptions): Promise<LiveTranscriptionSession> {
  const finals = new Map<number, string>();
  let partial = '';
  let partialIdx = -1;
  let active = true;

  const committed = () =>
    [...finals.entries()].sort((a, b) => a[0] - b[0]).map(([, t]) => t.trim()).filter(Boolean).join(' ');

  const report = () => {
    if (active) opts.onText(committed(), partial);
  };

  const client = new WebSocketSTTClient(opts.locale, { model: opts.model, keyterms: opts.keyterms });
  client.on('ready', () => opts.onReady?.());
  client.on('partial', ({ utterance, text }) => {
    if (utterance >= partialIdx) { partialIdx = utterance; partial = text; }
    report();
  });
  client.on('final', ({ utterance, text }) => {
    finals.set(utterance, text);
    if (utterance >= partialIdx) { partial = ''; }
    report();
  });
  client.on('error', msg => { if (active) opts.onError?.(msg); });

  const recorder = new PcmAudioRecorder();

  // Open the socket and the mic together; audio captured before the socket is
  // open is dropped by `send()` (a few ms at most).
  const [socketResult] = await Promise.allSettled([
    client.connect(),
    recorder.start(chunk => client.send(chunk), opts.stream),
  ]);
  if (socketResult.status === 'rejected') {
    recorder.stop();
    throw socketResult.reason instanceof Error ? socketResult.reason : new Error(String(socketResult.reason));
  }
  if (!recorder.recording()) {
    await client.close();
    throw new Error('Could not start the microphone');
  }

  let stopping: Promise<void> | null = null;

  const session: LiveTranscriptionSession = {
    analyser: recorder.analyser,
    committedText: committed,

    async stop() {
      if (stopping) return stopping;
      stopping = (async () => {
        recorder.stop();
        await client.end(); // waits for the last `final` / server `end`
        // Server did not finalize the trailing utterance (timeout/disconnect):
        // keep what we heard rather than losing it.
        if (partial.trim()) {
          finals.set(partialIdx === -1 ? finals.size : partialIdx, partial);
          partial = '';
        }
        report();
        active = false;
        await client.close();
      })();
      return stopping;
    },

    cancel() {
      active = false;
      recorder.stop();
      client.close().catch(() => {});
    },
  };

  return session;
}
