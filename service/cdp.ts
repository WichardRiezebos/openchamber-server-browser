// A Chrome DevTools Protocol connection over `--remote-debugging-pipe`.
//
// The pipe keeps the browser off the network entirely: there is no debugging
// port another local process could connect to, and Chrome shuts down when the
// pipe closes, so a killed service does not leave an orphaned browser behind.
// Messages are JSON, each terminated by a NUL byte (fd 3: to Chrome, fd 4: from Chrome).
import { EventEmitter } from 'node:events';
import type { Readable, Writable } from 'node:stream';

export type CdpParams = Record<string, unknown>;
// CDP results are wide and loosely typed; callers narrow what they read.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CdpResult = any;

type Pending = {
  resolve: (value: CdpResult) => void;
  reject: (error: Error) => void;
  method: string;
};

export class CdpError extends Error {
  constructor(public readonly method: string, message: string) {
    super(`${method}: ${message}`);
  }
}

export class CdpConnection extends EventEmitter {
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();
  private buffer: Buffer[] = [];
  private closed = false;

  constructor(private readonly out: Writable, input: Readable) {
    super();
    input.on('data', (chunk: Buffer) => this.onData(chunk));
    input.on('close', () => this.onClose());
    input.on('error', () => this.onClose());
    out.on('error', () => this.onClose());
  }

  get isClosed(): boolean {
    return this.closed;
  }

  send(method: string, params: CdpParams = {}, sessionId?: string, timeoutMs = 30_000): Promise<CdpResult> {
    if (this.closed) return Promise.reject(new CdpError(method, 'browser connection is closed'));
    const id = this.nextId;
    this.nextId += 1;
    const message: Record<string, unknown> = { id, method, params };
    if (sessionId) message.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new CdpError(method, `timed out after ${timeoutMs} ms`));
      }, timeoutMs);
      // Settle paths clear the timer so a late answer or close cannot double-fire.
      this.pending.set(id, {
        resolve: (value) => { clearTimeout(timer); resolve(value); },
        reject: (error) => { clearTimeout(timer); reject(error); },
        method,
      });
      this.out.write(`${JSON.stringify(message)}\0`);
    });
  }

  private onData(chunk: Buffer): void {
    let start = 0;
    let end = chunk.indexOf(0, start);
    while (end !== -1) {
      this.buffer.push(chunk.subarray(start, end));
      const raw = Buffer.concat(this.buffer).toString('utf8');
      this.buffer = [];
      this.dispatch(raw);
      start = end + 1;
      end = chunk.indexOf(0, start);
    }
    if (start < chunk.length) this.buffer.push(chunk.subarray(start));
  }

  private dispatch(raw: string): void {
    let message: { id?: number; method?: string; params?: CdpParams; sessionId?: string; result?: unknown; error?: { message?: string } };
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }
    if (typeof message.id === 'number') {
      const waiter = this.pending.get(message.id);
      if (!waiter) return;
      this.pending.delete(message.id);
      if (message.error) waiter.reject(new CdpError(waiter.method, message.error.message ?? 'unknown error'));
      else waiter.resolve(message.result ?? {});
      return;
    }
    if (typeof message.method === 'string') {
      this.emit('event', message.method, message.params ?? {}, message.sessionId);
    }
  }

  private onClose(): void {
    if (this.closed) return;
    this.closed = true;
    for (const waiter of this.pending.values()) waiter.reject(new CdpError(waiter.method, 'browser connection closed'));
    this.pending.clear();
    this.emit('close');
  }
}
