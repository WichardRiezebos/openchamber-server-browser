// Entry point: the HTTP service OpenChamber starts for this extension.
//
// - `POST /browser-control`: the agent's browser actions (provides: ["browser"]).
// - `/surface/*`: the live picture in the rail panel, and the person's input.
// - `/state`, `/navigate`, `/tab`, `/nav`, `/viewport`: the address bar docked above it.
import { timingSafeEqual } from 'node:crypto';
import http from 'node:http';

import {
  BROWSER_PROVIDER_PATH,
  SURFACE_AGENT_ACTIVE_HEADER,
  SURFACE_CLIPBOARD_PATH,
  SURFACE_CONTROL_PATH,
  SURFACE_FRAME_PATH,
  SURFACE_FRAME_SEQ_HEADER,
  SURFACE_HEIGHT_HEADER,
  SURFACE_INPUT_PATH,
  SURFACE_RESIZE_PATH,
  SURFACE_SEQ_HEADER,
  SURFACE_TITLE_HEADER,
  SURFACE_TITLE_MAX,
  SURFACE_VIEWER_HEADER,
  SURFACE_WIDTH_HEADER,
  readBrowserProviderRequest,
  readSurfaceControlNotice,
  readSurfaceInputBatch,
  readSurfaceResizeRequest,
  type BrowserProviderResult,
  type BrowserViewportMode,
  type SurfaceInputEvent,
} from '@openchamber/sdk';

import { handleAction } from './actions.ts';
import { ServerBrowser } from './browser.ts';
import { keyEventParams, modifierBits, shouldMapMetaToCtrl } from './keys.ts';
import { SELECTION_SCRIPT } from './page-scripts.ts';

const port = Number(process.env.OPENCHAMBER_SERVICE_PORT);
const token = process.env.OPENCHAMBER_SERVICE_TOKEN ?? '';
if (!port || !token) {
  console.error('OPENCHAMBER_SERVICE_PORT and OPENCHAMBER_SERVICE_TOKEN are required');
  process.exit(1);
}
const expectedAuthorization = Buffer.from(`Bearer ${token}`, 'utf8');

const browser = new ServerBrowser();

/** Largest ordinary request body; agent actions may carry page-sized payloads. */
const MAX_BODY = 1_000_000;
const MAX_ACTION_BODY = 2_000_000;

// One agent action at a time: actions from several chats would otherwise
// interleave clicks and typing on the same page.
let queue: Promise<unknown> = Promise.resolve();
const serialized = <T>(work: () => Promise<T>): Promise<T> => {
  const next = queue.then(work, work);
  queue = next.catch(() => undefined);
  return next;
};

const readBody = (req: http.IncomingMessage, limit = MAX_BODY): Promise<string> => new Promise((resolve, reject) => {
  const chunks: Buffer[] = [];
  let size = 0;
  req.on('data', (chunk: Buffer) => {
    size += chunk.length;
    if (size > limit) {
      reject(new Error('body too large'));
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  req.on('error', reject);
});

const sendJson = (res: http.ServerResponse, status: number, body: unknown): void => {
  const text = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(text) });
  res.end(text);
};

const parseJson = (text: string): Record<string, unknown> | null => {
  try {
    const value: unknown = JSON.parse(text);
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
};

// ---- Agent actions ----

const handleBrowserControl = async (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> => {
  const request = readBrowserProviderRequest(await readBody(req, MAX_ACTION_BODY));
  if (!request) {
    sendJson(res, 400, { ok: false, error: 'Not a browser action' });
    return;
  }
  let result: BrowserProviderResult;
  try {
    result = await serialized(() => handleAction(browser, request));
  } catch (error) {
    result = { ok: false, error: (error as Error).message || 'The browser action failed.' };
  }
  sendJson(res, 200, result);
};

// ---- Shared surface ----

const handleFrame = async (res: http.ServerResponse, url: URL): Promise<void> => {
  browser.markFrameWanted();
  const after = Number(url.searchParams.get('after') ?? '0') || 0;
  const wait = Math.min(Math.max(Number(url.searchParams.get('wait') ?? '0') || 0, 0), 25_000);
  if (!browser.running) {
    // A viewer opening the panel starts the browser, so there is something to see.
    await browser.ensure().catch(() => undefined);
  }
  const deadline = Date.now() + wait;
  while ((browser.seq <= after || !browser.currentFrame()) && Date.now() < deadline) {
    await browser.waitForFrame(after, deadline - Date.now());
  }
  const frame = browser.currentFrame();
  if (!frame || browser.seq <= after) {
    res.writeHead(204);
    res.end();
    return;
  }
  const shown = browser.shownTab;
  const title = (shown?.title || shown?.url || 'Server Browser').slice(0, SURFACE_TITLE_MAX);
  const headers: http.OutgoingHttpHeaders = {
    'Content-Type': frame.mime,
    'Content-Length': frame.bytes.length,
    // The seq the picture was captured at, not the current one: seq also bumps
    // without a new frame (an agent going active), and the header must describe
    // these bytes, not whatever happened since.
    [SURFACE_SEQ_HEADER]: String(frame.seq),
    [SURFACE_WIDTH_HEADER]: String(frame.width),
    [SURFACE_HEIGHT_HEADER]: String(frame.height),
    // Header values must be Latin-1; anything else is dropped from the title.
    [SURFACE_TITLE_HEADER]: title.replace(/[^\x20-\x7e\xa0-\xff]/g, ''),
  };
  if (Date.now() < browser.agentActiveUntil) headers[SURFACE_AGENT_ACTIVE_HEADER] = '1';
  res.writeHead(200, headers);
  res.end(frame.bytes);
};

/** Collapses runs of hover moves to their last one; a drag (buttons held)
 * keeps every point for drawing. */
const coalesceHoverMoves = (events: SurfaceInputEvent[]): SurfaceInputEvent[] => {
  const kept: SurfaceInputEvent[] = [];
  for (const event of events) {
    const previous = kept[kept.length - 1];
    const bothHoverMoves = event.type === 'pointer' && event.action === 'move' && event.buttons === 0
      && previous?.type === 'pointer' && previous.action === 'move' && previous.buttons === 0;
    if (bothHoverMoves) kept[kept.length - 1] = event;
    else kept.push(event);
  }
  return kept;
};

/** Applies the events to the page. Pointer moves are the exception: they
 * stream in at frame rate while someone steers, and waiting for each answer
 * cost a frame (~16 ms) per move, so the click that ended the gesture landed
 * seconds late. Moves are therefore written without waiting — CDP commands on
 * one session run in order, and pages see mousemove aligned to frames anyway,
 * so dropping the in-between hover positions changes nothing. Everything else
 * is applied before this returns, so a batch is done when the request answers
 * (the host reads /surface/clipboard right behind a copy chord). */
const applyInput = async (events: SurfaceInputEvent[]): Promise<void> => {
  const tab = browser.shownTab;
  if (!tab) return;
  for (const event of coalesceHoverMoves(events)) {
    if (event.type === 'pointer' && event.action === 'move') {
      void browser.userPointer(tab, event.action, event.x, event.y, event.button, event.buttons, modifierBits(event.modifiers)).catch(() => undefined);
    } else if (event.type === 'pointer') {
      await browser.userPointer(tab, event.action, event.x, event.y, event.button, event.buttons, modifierBits(event.modifiers)).catch(() => undefined);
    } else if (event.type === 'wheel') {
      await browser.userWheel(tab, event.x, event.y, event.deltaX, event.deltaY, modifierBits(event.modifiers)).catch(() => undefined);
    } else if (event.type === 'key') {
      const modifiers = shouldMapMetaToCtrl(event) ? { ...event.modifiers, meta: false, ctrl: true } : event.modifiers;
      await browser.dispatchKey(tab, keyEventParams({ ...event, modifiers })).catch(() => undefined);
    } else if (event.type === 'text') {
      await browser.insertText(tab, event.text).catch(() => undefined);
    }
  }
};

const handleSurface = async (req: http.IncomingMessage, res: http.ServerResponse, url: URL): Promise<boolean> => {
  if (url.pathname === SURFACE_FRAME_PATH && req.method === 'GET') {
    await handleFrame(res, url);
    return true;
  }
  if (url.pathname === SURFACE_INPUT_PATH && req.method === 'POST') {
    const batch = readSurfaceInputBatch(await readBody(req));
    if (!batch) {
      res.writeHead(400);
      res.end();
      return true;
    }
    const drawn = Number(req.headers[SURFACE_FRAME_SEQ_HEADER] ?? '0') || 0;
    if (drawn > 0 && drawn < browser.tabFirstSeq) {
      // Made on a picture of a tab that is no longer on screen.
      res.writeHead(409);
      res.end();
      return true;
    }
    await applyInput(batch.events);
    res.writeHead(204);
    res.end();
    return true;
  }
  if (url.pathname === SURFACE_CONTROL_PATH && req.method === 'POST') {
    const notice = readSurfaceControlNotice(await readBody(req));
    if (!notice) {
      res.writeHead(400);
      res.end();
      return true;
    }
    browser.controller = notice.controller;
    browser.controllingViewer = notice.controller === 'user' ? notice.viewer ?? null : null;
    res.writeHead(204);
    res.end();
    return true;
  }
  if (url.pathname === SURFACE_RESIZE_PATH && req.method === 'POST') {
    const request = readSurfaceResizeRequest(await readBody(req));
    if (!request) {
      res.writeHead(400);
      res.end();
      return true;
    }
    const size = await browser.resizeForPanel(request.width, request.height).catch(() => null);
    if (!size) {
      res.writeHead(400);
      res.end();
      return true;
    }
    sendJson(res, 200, size);
    return true;
  }
  if (url.pathname === SURFACE_CLIPBOARD_PATH && req.method === 'GET') {
    const tab = browser.shownTab;
    const text = tab ? await browser.evaluate<string>(tab, SELECTION_SCRIPT).catch(() => '') : '';
    sendJson(res, 200, { text: String(text ?? '') });
    return true;
  }
  return false;
};

// ---- Docked address bar ----

/** Someone else is driving: the dock of another viewer only watches. */
const dockBlocked = (req: http.IncomingMessage): boolean => {
  if (browser.controller !== 'user' || !browser.controllingViewer) return false;
  const viewer = req.headers[SURFACE_VIEWER_HEADER];
  return typeof viewer === 'string' && viewer !== browser.controllingViewer;
};

const normalizeAddress = (input: string): string => {
  const value = input.trim();
  // `host:port/path` also looks like `scheme:…`, so only `scheme://` and a few
  // schemes without slashes count as already complete.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) || /^(about|data|blob|view-source):/i.test(value)) return value;
  // An IPv6 literal (`[::1]:3000`) splits on colons all wrong below; a bracketed
  // address is a machine on this host, so plain http.
  if (value.startsWith('[')) return `http://${value}`;
  // Bare host names: local ones over http, everything else over https.
  const host = value.split('/')[0].split(':')[0];
  const local = host === 'localhost' || host.endsWith('.localhost') || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.endsWith('.test');
  return `${local ? 'http' : 'https'}://${value}`;
};

const handleDock = async (req: http.IncomingMessage, res: http.ServerResponse, url: URL): Promise<boolean> => {
  if (url.pathname === '/state' && req.method === 'GET') {
    const shown = browser.shownTab;
    sendJson(res, 200, {
      running: browser.running,
      error: browser.lastError,
      url: shown && !shown.url.startsWith('data:') ? shown.url : '',
      title: shown?.title ?? '',
      loading: shown?.loading ?? false,
      viewport: shown ? shown.viewportMode : browser.config.defaultViewport,
      tabs: browser.listTabs(),
      controller: browser.controller,
      agentActive: Date.now() < browser.agentActiveUntil,
      streaming: browser.streaming,
    });
    return true;
  }
  if (req.method !== 'POST' || !['/navigate', '/tab', '/nav', '/viewport', '/restart'].includes(url.pathname)) return false;
  if (dockBlocked(req)) {
    sendJson(res, 409, { ok: false, error: 'Someone else is in control of the browser.' });
    return true;
  }
  const body = parseJson(await readBody(req)) ?? {};
  try {
    if (url.pathname === '/restart') {
      await serialized(async () => {
        await browser.close();
        await browser.ensure();
      });
      sendJson(res, 200, { ok: true });
      return true;
    }
    await browser.ensure();
    const tab = browser.shownTab;
    if (url.pathname === '/navigate') {
      const address = typeof body.url === 'string' ? body.url : '';
      if (!address.trim()) {
        sendJson(res, 400, { ok: false, error: 'url is required' });
        return true;
      }
      if (!tab) throw new Error('No tab is open.');
      // Fire-and-forget so the dock answers at once; the failure still shows
      // somewhere, in the service log.
      void browser.navigate(tab, normalizeAddress(address), 30_000).catch((error: Error) => console.error('navigate failed:', error.message));
    } else if (url.pathname === '/tab') {
      const id = typeof body.id === 'string' ? body.id : '';
      if (!browser.tabs.has(id)) throw new Error(`No tab ${id}`);
      browser.show(id);
    } else if (url.pathname === '/nav') {
      if (!tab) throw new Error('No tab is open.');
      if (body.action === 'reload') await browser.reload(tab);
      else {
        const history = await browser.evaluateHistory(tab);
        const entry = history.entries[history.currentIndex + (body.action === 'forward' ? 1 : -1)];
        if (entry) await browser.goToHistoryEntry(tab, entry.id);
      }
    } else if (url.pathname === '/viewport') {
      const mode = body.mode;
      if (!tab || (mode !== 'mobile' && mode !== 'tablet' && mode !== 'desktop' && mode !== 'fill')) throw new Error('Unknown viewport');
      await browser.setViewport(tab, mode as BrowserViewportMode);
    }
    sendJson(res, 200, { ok: true });
  } catch (error) {
    sendJson(res, 200, { ok: false, error: (error as Error).message });
  }
  return true;
};

// ---- Server ----

const server = http.createServer((req, res) => {
  // Constant-time compare with a length guard (timingSafeEqual throws on
  // unequal lengths), so the check does not leak the token one byte at a time.
  const given = Buffer.from(req.headers.authorization ?? '', 'utf8');
  if (given.length !== expectedAuthorization.length || !timingSafeEqual(given, expectedAuthorization)) {
    sendJson(res, 401, { ok: false, error: 'unauthorized' });
    return;
  }
  const url = new URL(req.url ?? '/', 'http://127.0.0.1');
  const route = async (): Promise<void> => {
    if (url.pathname === '/health') {
      sendJson(res, 200, { ok: true });
      return;
    }
    if (url.pathname === BROWSER_PROVIDER_PATH && req.method === 'POST') {
      await handleBrowserControl(req, res);
      return;
    }
    if (url.pathname.startsWith('/surface/') && await handleSurface(req, res, url)) return;
    if (await handleDock(req, res, url)) return;
    sendJson(res, 404, { ok: false, error: 'not-found' });
  };
  route().catch((error: Error) => {
    if (!res.headersSent) sendJson(res, 500, { ok: false, error: error.message });
    else res.end();
  });
});

// A listen failure (port taken, host unreachable) would otherwise become an
// unhandled 'error' event that kills the process without a word.
server.on('error', (error) => { console.error('service failed:', (error as Error).message); process.exit(1); });
server.listen(port, '127.0.0.1');

let stopping = false;
const shutdown = (): void => {
  if (stopping) return;
  stopping = true;
  server.close();
  void browser.close().finally(() => process.exit(0));
  setTimeout(() => process.exit(0), 3_000).unref();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('exit', () => browser.kill());
