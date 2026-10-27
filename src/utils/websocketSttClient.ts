/**
 * WebSocket client for real-time Speech-to-Text (`WS /ws/speech-to-text`),
 * which the backend relays to Sarvam AI's realtime streaming API.
 *
 * Wire protocol:
 *   client -> server : binary frames of raw 16 kHz mono 16-bit PCM,
 *                      then a text frame {"type":"end"}.
 *   server -> client : {"type":"ready"}
 *                      {"type":"partial","utterance":n,"text":"..."}  (live, revisable)
 *                      {"type":"final","utterance":n,"text":"..."}    (utterance done)
 *                      {"type":"error","code":"...","message":"...","fatal":bool}
 *                      {"type":"end","audio_duration_s":..,"total_utterances":..}
 *
 * Usage:
 *   const client = new WebSocketSTTClient('kn');
 *   client.on('partial', ({ text }) => showProvisional(text));
 *   client.on('final',   ({ text }) => commit(text));
 *   client.on('error',   (msg) => showError(msg));
 *   await client.connect();
 *   recorder.start(chunk => client.send(chunk));
 *   ...
 *   await client.end();    // sends {"type":"end"} and waits for the last final
 *   await client.close();
 *
 * Most screens should use `startLiveTranscription()` from `liveTranscription.ts`
 * instead of driving this class directly.
 */

export type SttTranscriptEvent = { utterance: number; text: string };
export type SttEndEvent = { audio_duration_s?: number; total_utterances?: number };

type EventMap = {
  connected: null;
  ready: { request_id?: string };
  partial: SttTranscriptEvent;
  final: SttTranscriptEvent;
  /** Back-compat alias of `final`: receives the final text as a string. */
  transcript: string;
  error: string;
  end: SttEndEvent;
  closed: null;
};
export type EventType = keyof EventMap;
type EventCallback<K extends EventType = EventType> = (data: EventMap[K]) => void;

export type SttModel = 'saaras:v3-realtime' | 'saaras:v4';

export interface WebSocketSTTClientOptions {
  model?: SttModel;
  /** Domain terms to bias recognition toward (saaras:v4 only). */
  keyterms?: string[];
}

/** How long `end()` waits for the server to flush the last utterance. */
const END_TIMEOUT_MS = 20000;

export class WebSocketSTTClient {
  private ws: WebSocket | null = null;
  private locale: string;
  private options: WebSocketSTTClientOptions;
  private listeners: Map<EventType, EventCallback<any>[]> = new Map();
  private isConnected = false;
  private ended = false;

  constructor(locale: string = 'kn', options: WebSocketSTTClientOptions = {}) {
    this.locale = locale;
    this.options = options;
  }

  /** Open the WebSocket. Resolves once the socket is open; rejects on failure. */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.warn('[STT WS] already connected');
      return;
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      try {
        const wsUrl = this.buildWebSocketUrl();
        console.log(`[STT WS] Connecting to ${wsUrl}`);

        this.ws = new WebSocket(wsUrl);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          this.isConnected = true;
          this.emit('connected', null);
          settled = true;
          resolve();
        };

        this.ws.onmessage = (event) => this.handleMessage(event.data);

        this.ws.onerror = () => {
          // The browser gives no detail here; the matching `close` follows.
          if (!settled) {
            settled = true;
            reject(new Error('Could not reach the speech-to-text service'));
          }
        };

        this.ws.onclose = (event) => {
          const wasConnected = this.isConnected;
          this.isConnected = false;
          if (wasConnected && !this.ended && event.code !== 1000) {
            this.emit('error', `Connection closed unexpectedly (${event.code})`);
          }
          this.emit('closed', null);
          if (!settled) {
            settled = true;
            reject(new Error('Speech-to-text connection was refused'));
          }
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        reject(new Error(`Failed to connect: ${msg}`));
      }
    });
  }

  /** Send one chunk of 16 kHz mono 16-bit PCM. Silently drops if not connected. */
  send(chunk: Uint8Array | ArrayBuffer): void {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN || this.ended) return;
    try {
      this.ws.send(chunk);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.emit('error', `Failed to send audio: ${msg}`);
    }
  }

  /**
   * Signal end of audio and wait for the server to flush the last utterance
   * (resolves on the server's `end` frame, on close, or after a timeout).
   */
  async end(): Promise<void> {
    if (!this.isConnected || !this.ws || this.ended) return;
    this.ended = true;

    const done = new Promise<void>(resolve => {
      const finish = () => {
        this.off('end', finish);
        this.off('closed', finish);
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(finish, END_TIMEOUT_MS);
      this.on('end', finish);
      this.on('closed', finish);
    });

    try {
      this.ws.send(JSON.stringify({ type: 'end' }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.emit('error', `Failed to send end signal: ${msg}`);
    }
    await done;
  }

  /** Close the socket (no-op if already closed). */
  async close(): Promise<void> {
    const ws = this.ws;
    if (!ws) return;
    this.ws = null;
    if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
      this.isConnected = false;
      return;
    }
    await new Promise<void>(resolve => {
      const onClose = () => { ws.removeEventListener('close', onClose); resolve(); };
      ws.addEventListener('close', onClose);
      try { ws.close(1000, 'Normal closure'); } catch { onClose(); }
    });
  }

  on<K extends EventType>(event: K, callback: EventCallback<K>): void {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(callback);
  }

  off<K extends EventType>(event: K, callback: EventCallback<K>): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    const idx = callbacks.indexOf(callback);
    if (idx !== -1) callbacks.splice(idx, 1);
  }

  connected(): boolean {
    return this.isConnected;
  }

  getLocale(): string {
    return this.locale;
  }

  // ── Private ────────────────────────────────────────────────────────────────

  /**
   * WebSocket URL for the streaming endpoint.
   * - If VITE_API_BASE_URL is set, the socket goes to that host.
   * - Otherwise same-origin (Vite dev proxy / Nginx both forward `/ws/`).
   */
  private buildWebSocketUrl(): string {
    const base = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
    let origin: string;
    if (base) {
      const u = new URL(base, window.location.href);
      u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
      origin = u.origin;
    } else {
      origin = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`;
    }
    const params = new URLSearchParams({ locale: this.locale });
    if (this.options.model) params.set('model', this.options.model);
    if (this.options.keyterms?.length) params.set('keyterms', this.options.keyterms.join(','));
    return `${origin}/ws/speech-to-text?${params.toString()}`;
  }

  private handleMessage(data: ArrayBuffer | string): void {
    if (typeof data !== 'string') return; // server only sends JSON text frames
    let msg: any;
    try {
      msg = JSON.parse(data);
    } catch {
      this.emit('error', 'Malformed message from speech-to-text service');
      return;
    }
    switch (msg.type) {
      case 'ready':
        this.emit('ready', { request_id: msg.request_id });
        break;
      case 'partial':
        this.emit('partial', { utterance: Number(msg.utterance ?? 0), text: String(msg.text ?? '') });
        break;
      case 'final': {
        const ev = { utterance: Number(msg.utterance ?? 0), text: String(msg.text ?? '') };
        this.emit('final', ev);
        this.emit('transcript', ev.text);
        break;
      }
      case 'transcript': // old backend protocol — treat as a single final
        this.emit('final', { utterance: 0, text: String(msg.text ?? '') });
        this.emit('transcript', String(msg.text ?? ''));
        break;
      case 'error':
        this.emit('error', String(msg.message || 'Unknown error from speech-to-text service'));
        break;
      case 'end':
        this.ended = true;
        this.emit('end', { audio_duration_s: msg.audio_duration_s, total_utterances: msg.total_utterances });
        break;
      default:
        console.warn('[STT WS] Unknown message type:', msg.type, msg);
    }
  }

  private emit<K extends EventType>(event: K, data: EventMap[K]): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    for (const cb of [...callbacks]) {
      try {
        cb(data);
      } catch (err) {
        console.error(`[STT WS] Error in ${event} listener:`, err);
      }
    }
  }
}
