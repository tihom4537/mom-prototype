/**
 * WebSocket client for real-time Speech-to-Text streaming via Sarvam AI.
 *
 * Usage:
 *   const client = new WebSocketSTTClient('en');
 *
 *   client.on('transcript', (text: string) => console.log('Transcript:', text));
 *   client.on('speech_start', () => console.log('Speech detected'));
 *   client.on('speech_end', () => console.log('Speech ended'));
 *   client.on('error', (msg: string) => console.error('Error:', msg));
 *
 *   await client.connect();
 *   await client.send(audioChunk1);
 *   await client.send(audioChunk2);
 *   await client.end(); // Send end signal
 *   await client.close(); // Close connection
 */

type EventType = 'transcript' | 'speech_start' | 'speech_end' | 'error' | 'connected' | 'closed';
type EventCallback = (data: any) => void;

export class WebSocketSTTClient {
  private ws: WebSocket | null = null;
  private locale: string;
  private listeners: Map<EventType, EventCallback[]> = new Map();
  private isConnected = false;
  private messageBuffer: (string | Uint8Array)[] = [];

  constructor(locale: string = 'en') {
    this.locale = locale;
  }

  /**
   * Connect to the WebSocket endpoint.
   * Throws an error if connection fails.
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.warn('WebSocketSTTClient already connected');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = this.buildWebSocketUrl();
        console.log(`[STT WS] Connecting to ${wsUrl}`);

        this.ws = new WebSocket(wsUrl);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          console.log('[STT WS] Connected');
          this.isConnected = true;
          this.emit('connected', null);
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (event) => {
          console.error('[STT WS] WebSocket error:', event);
          const msg = 'WebSocket connection error';
          this.emit('error', msg);
          reject(new Error(msg));
        };

        this.ws.onclose = () => {
          console.log('[STT WS] Connection closed');
          this.isConnected = false;
          this.emit('closed', null);
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        console.error('[STT WS] Connection error:', msg);
        reject(new Error(`Failed to connect: ${msg}`));
      }
    });
  }

  /**
   * Send an audio chunk to the server.
   * Automatically converts Blob to Uint8Array if needed.
   */
  async send(chunk: Uint8Array | Blob): Promise<void> {
    if (!this.isConnected || !this.ws) {
      throw new Error('WebSocket not connected');
    }

    let data: Uint8Array;
    if (chunk instanceof Blob) {
      data = new Uint8Array(await chunk.arrayBuffer());
    } else {
      data = chunk;
    }

    try {
      this.ws.send(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[STT WS] Send error:', msg);
      this.emit('error', `Failed to send audio: ${msg}`);
      throw err;
    }
  }

  /**
   * Signal end of audio stream.
   * Server will finalize transcription and close connection.
   */
  async end(): Promise<void> {
    if (!this.isConnected || !this.ws) {
      throw new Error('WebSocket not connected');
    }

    try {
      const endMessage = JSON.stringify({ type: 'end' });
      this.ws.send(endMessage);
      console.log('[STT WS] Sent end signal');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[STT WS] End signal error:', msg);
      this.emit('error', `Failed to send end signal: ${msg}`);
      throw err;
    }
  }

  /**
   * Close the WebSocket connection.
   */
  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.ws) {
        console.warn('[STT WS] close called but ws is null');
        resolve();
        return;
      }

      if (this.isConnected) {
        const onClose = () => {
          this.ws?.removeEventListener('close', onClose);
          resolve();
        };
        this.ws.addEventListener('close', onClose);
        this.ws.close(1000, 'Normal closure');
      } else {
        this.ws = null;
        resolve();
      }
    });
  }

  /**
   * Register a listener for an event type.
   * Can register multiple listeners for the same event.
   */
  on(event: EventType, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Unregister a listener.
   */
  off(event: EventType, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const idx = callbacks.indexOf(callback);
      if (idx !== -1) {
        callbacks.splice(idx, 1);
      }
    }
  }

  /**
   * Check if the WebSocket is currently connected.
   */
  connected(): boolean {
    return this.isConnected;
  }

  /**
   * Get the current locale.
   */
  getLocale(): string {
    return this.locale;
  }

  // ── Private methods ────────────────────────────────────────────────────────

  /**
   * Build the WebSocket URL from the current API base.
   * Handles both dev (localhost:8000) and prod (https://domain) setups.
   */
  private buildWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;

    // In dev, Vite proxies HTTP but WebSocket needs explicit localhost:8000
    // In prod, WebSocket goes to the same domain
    const wsHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'localhost:8000'
      : host;

    return `${protocol}://${wsHost}/ws/speech-to-text?locale=${this.locale}`;
  }

  /**
   * Handle incoming WebSocket messages.
   * Parses JSON text frames and dispatches events.
   */
  private handleMessage(data: ArrayBuffer | string): void {
    try {
      // Binary frames (unexpected, log but ignore)
      if (data instanceof ArrayBuffer) {
        console.warn('[STT WS] Received binary frame (unexpected)');
        return;
      }

      // Parse JSON text frame
      const msg = JSON.parse(data);
      const type = msg.type;

      switch (type) {
        case 'transcript':
          this.emit('transcript', msg.text || '');
          break;
        case 'speech_start':
          this.emit('speech_start', null);
          break;
        case 'speech_end':
          this.emit('speech_end', null);
          break;
        case 'error':
          this.emit('error', msg.message || 'Unknown error from server');
          break;
        default:
          console.warn('[STT WS] Unknown message type:', type, msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown parse error';
      console.error('[STT WS] Message parse error:', msg, data);
      this.emit('error', `Failed to parse server message: ${msg}`);
    }
  }

  /**
   * Emit an event to all registered listeners.
   */
  private emit(event: EventType, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[STT WS] Error in ${event} callback:`, err);
        }
      });
    }
  }
}
