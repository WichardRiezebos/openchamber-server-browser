// The browser itself: one headless Chrome on the OpenChamber host, its tabs,
// and the live picture of whichever tab is shown.
//
// Because Chrome runs on the same machine as the dev servers, `localhost` and
// `*.localhost` mean that machine, which is the whole point: the agent and the
// person watching both see the stack the agent is working on.
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, readlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Readable, Writable } from 'node:stream';

import type {
  BrowserConsoleProblem,
  BrowserProviderContext,
  BrowserTab,
  BrowserViewportMode,
  BrowserViewportSummary,
} from '@openchamber/sdk';

import { CdpConnection, type CdpParams, type CdpResult } from './cdp.ts';
import { findChrome, loadConfig, type Config } from './config.ts';

export const VIEWPORTS: Record<Exclude<BrowserViewportMode, 'fill'>, { width: number; height: number }> = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1280, height: 800 },
};

const FILL_FALLBACK = { width: 1280, height: 800 };
const CONSOLE_KEEP = 30;
/** Grace after an action before it is decided whether it started a navigation. */
const SETTLE_MS = 200;
/** Grace after a load stops while late paints and title updates land. */
const POST_LOAD_MS = 250;
/** Frames nobody asks for still cost base64 decoding and JPEG parsing on the
 * service's single thread; the screencast stops after this long without a viewer. */
const SCREENCAST_IDLE_MS = 5_000;
const START_PAGE = `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html><html><head><title>Server Browser</title>
<meta name="color-scheme" content="light dark"><style>
body{font:15px/1.5 system-ui,sans-serif;display:grid;place-items:center;height:100vh;margin:0;color:#555;background:#f6f6f4}
@media (prefers-color-scheme:dark){body{background:#1c1c1c;color:#aaa}}
main{max-width:30em;padding:2em;text-align:center}h1{font-size:18px;font-weight:600;margin:0 0 .5em}
</style></head><body><main><h1>Server Browser is ready</h1>
<p>Pages an agent opens appear here. Type an address above to browse yourself; click the picture to take control.</p>
</main></body></html>`)}`;

export type Tab = {
  id: string;
  targetId: string;
  sessionId: string;
  /** The chat that opened the tab; null for the start page and pages the user opened. */
  openedBy: string | null;
  url: string;
  title: string;
  mainFrameId: string | null;
  viewportMode: BrowserViewportMode;
  width: number;
  height: number;
  loading: boolean;
  /** Bumped on every main-frame load start, so an action can tell it caused one. */
  loadSeq: number;
  /** Waked with `true` when the main frame stops loading, `false` when the tab is gone. */
  stopWaiters: Array<(stopped: boolean) => void>;
  console: BrowserConsoleProblem[];
  lastUsed: number;
  /** Settles once the tab is set up and running. */
  ready: Promise<void>;
};

type Frame = {
  bytes: Buffer;
  mime: 'image/jpeg' | 'image/png';
  width: number;
  height: number;
  /** Viewport CSS pixels the picture covers, to map input back onto the page. */
  cssWidth: number;
  cssHeight: number;
  /** The `seq` this picture is current for; `touch()` keeps it in step with `this.seq`. */
  seq: number;
};

export type Controller = 'none' | 'agent' | 'user';

const sleep = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms); });

/** JPEG frames carry their size in the SOF marker; PNG in IHDR. */
const imageSize = (bytes: Buffer): { width: number; height: number } | null => {
  if (bytes[0] === 0x89 && bytes.toString('ascii', 1, 4) === 'PNG') {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
};

const summarizeArgs = (args: Array<{ type?: string; value?: unknown; description?: string }> | undefined): string => (
  (args ?? [])
    .map((arg) => (arg.value !== undefined ? (typeof arg.value === 'string' ? arg.value : JSON.stringify(arg.value)) : arg.description ?? arg.type ?? ''))
    .join(' ')
    .slice(0, 500)
);

export class ServerBrowser {
  config: Config = loadConfig();
  private proc: ChildProcess | null = null;
  private conn: CdpConnection | null = null;
  private starting: Promise<void> | null = null;
  private stderrTail: string[] = [];
  lastError: string | null = null;

  readonly tabs = new Map<string, Tab>();
  private readonly byTarget = new Map<string, Tab>();
  private readonly bySession = new Map<string, Tab>();
  private readonly attachWaiters = new Map<string, (tab: Tab) => void>();
  private nextTab = 1;
  /** Tabs being created by us right now; any other new page is a popup. */
  private creating = 0;
  shownTabId: string | null = null;

  // ---- Surface state ----
  private frame: Frame | null = null;
  seq = 1;
  /** First sequence number drawn from the shown tab; input made on older pictures is refused. */
  tabFirstSeq = 1;
  private frameWaiters: Array<() => void> = [];
  controller: Controller = 'none';
  controllingViewer: string | null = null;
  agentActiveUntil = 0;
  private agentActiveTimer: NodeJS.Timeout | null = null;
  panelSize: { width: number; height: number } | null = null;
  private lastDown = { at: 0, x: 0, y: 0, button: -1, count: 0 };
  /** True from the moment a screencast starts until the idle timer stops it. */
  private screencastActive = false;
  private frameWantedAt = 0;
  private idleTimer: NodeJS.Timeout | null = null;

  // ---- Lifecycle ----

  get running(): boolean {
    return Boolean(this.conn && !this.conn.isClosed);
  }

  async ensure(): Promise<void> {
    if (this.running && this.tabs.size > 0) return;
    if (!this.starting) {
      this.starting = this.launch().finally(() => { this.starting = null; });
    }
    await this.starting;
  }

  private async launch(): Promise<void> {
    this.config = loadConfig();
    const chrome = findChrome(this.config);
    if ('error' in chrome) {
      this.lastError = chrome.error;
      throw new Error(chrome.error);
    }
    mkdirSync(this.config.profileDir, { recursive: true });
    this.clearStaleProfileLock();

    const args = [
      '--headless=new',
      '--remote-debugging-pipe',
      `--user-data-dir=${this.config.profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-features=Translate,MediaRouter,OptimizationHints',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--mute-audio',
      '--password-store=basic',
      '--use-mock-keychain',
      `--window-size=${VIEWPORTS.desktop.width},${VIEWPORTS.desktop.height}`,
    ];
    // Chrome refuses to start as root without this.
    if (process.getuid?.() === 0) args.push('--no-sandbox');
    args.push(...this.config.extraArgs, 'about:blank');

    this.stderrTail = [];
    const proc = spawn(chrome.path, args, { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
    this.proc = proc;
    proc.stderr?.on('data', (chunk: Buffer) => {
      for (const line of chunk.toString('utf8').split('\n')) {
        if (!line.trim()) continue;
        this.stderrTail.push(line.slice(0, 300));
        if (this.stderrTail.length > 15) this.stderrTail.shift();
      }
    });
    const exited = new Promise<number | null>((resolve) => {
      proc.once('exit', (code) => resolve(code));
      proc.once('error', () => resolve(-1));
    });
    proc.once('exit', () => this.onBrowserGone(proc));

    // SAFETY: stdio 3 and 4 were opened as pipes above.
    const conn = new CdpConnection(proc.stdio[3] as Writable, proc.stdio[4] as Readable);
    this.conn = conn;
    conn.on('event', (method: string, params: CdpResult, sessionId?: string) => this.onEvent(method, params, sessionId));

    try {
      const version = await Promise.race([
        conn.send('Browser.getVersion'),
        exited.then((code) => { throw new Error(`Chrome exited (code ${code})`); }),
        sleep(30_000).then(() => { throw new Error('Chrome did not answer within 30 s'); }),
      ]);
      void version;
      await conn.send('Target.setDiscoverTargets', { discover: true });
      await conn.send('Target.setAutoAttach', { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
      // The about:blank Chrome started with was created before auto-attach; adopt it.
      const { targetInfos } = await conn.send('Target.getTargets');
      for (const info of targetInfos ?? []) {
        if (info.type === 'page' && !this.byTarget.has(info.targetId)) {
          await conn.send('Target.attachToTarget', { targetId: info.targetId, flatten: true }).catch(() => undefined);
        }
      }
      await sleep(100);
      if (this.tabs.size === 0) await this.createTab(START_PAGE, null);
      else {
        const first = [...this.tabs.values()][0];
        await first.ready;
        await this.navigate(first, START_PAGE, 5_000).catch(() => undefined);
        this.show(first.id);
      }
      this.lastError = null;
    } catch (error) {
      const detail = this.stderrTail.slice(-4).join(' | ');
      this.lastError = `Could not start Chrome at ${chrome.path}: ${(error as Error).message}${detail ? ` — ${detail}` : ''}`;
      this.kill();
      throw new Error(this.lastError);
    }
  }

  /** A profile left locked by a browser from a service that was killed hard. */
  private clearStaleProfileLock(): void {
    try {
      const target = readlinkSync(path.join(this.config.profileDir, 'SingletonLock'));
      const [host, pidText] = [target.slice(0, target.lastIndexOf('-')), target.slice(target.lastIndexOf('-') + 1)];
      const pid = Number(pidText);
      if (host === os.hostname() && pid > 0) {
        try { process.kill(pid, 'SIGKILL'); } catch { /* already gone */ }
      }
    } catch {
      // no lock
    }
  }

  private onBrowserGone(proc: ChildProcess): void {
    if (this.proc !== proc) return;
    this.proc = null;
    this.conn = null;
    this.tabs.clear();
    this.byTarget.clear();
    this.bySession.clear();
    this.shownTabId = null;
    this.frame = null;
    this.screencastActive = false;
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
    this.touch();
  }

  kill(): void {
    const proc = this.proc;
    if (!proc) return;
    try { proc.kill('SIGKILL'); } catch { /* gone */ }
    this.onBrowserGone(proc);
  }

  async close(): Promise<void> {
    const conn = this.conn;
    const proc = this.proc;
    if (!conn || !proc) return;
    await Promise.race([conn.send('Browser.close').catch(() => undefined), sleep(2_000)]);
    await sleep(200);
    this.kill();
  }

  private send(method: string, params: CdpParams = {}, sessionId?: string): Promise<CdpResult> {
    if (!this.conn) return Promise.reject(new Error('The browser is not running.'));
    return this.conn.send(method, params, sessionId);
  }

  // ---- Events ----

  private onEvent(method: string, params: CdpResult, sessionId?: string): void {
    if (method === 'Target.attachedToTarget') {
      void this.onAttached(params);
      return;
    }
    if (method === 'Target.detachedFromTarget' || method === 'Target.targetDestroyed') {
      const tab = params.sessionId ? this.bySession.get(params.sessionId) : this.byTarget.get(params.targetId);
      if (tab) this.forget(tab);
      return;
    }
    if (method === 'Target.targetInfoChanged') {
      const info = params.targetInfo;
      const tab = info && this.byTarget.get(info.targetId);
      if (tab) {
        const titleChanged = tab.title !== info.title;
        tab.title = info.title ?? tab.title;
        tab.url = info.url ?? tab.url;
        if (titleChanged && tab.id === this.shownTabId) this.touch();
      }
      return;
    }
    const tab = sessionId ? this.bySession.get(sessionId) : undefined;
    if (!tab) return;
    switch (method) {
      case 'Page.frameStartedLoading':
        if (!tab.mainFrameId || params.frameId === tab.mainFrameId) {
          tab.loading = true;
          tab.loadSeq += 1;
        }
        break;
      case 'Page.frameStoppedLoading':
        if (!tab.mainFrameId || params.frameId === tab.mainFrameId) {
          tab.loading = false;
          for (const wake of tab.stopWaiters.splice(0)) wake(true);
        }
        break;
      case 'Page.frameNavigated':
        if (!params.frame?.parentId) {
          tab.mainFrameId = params.frame.id;
          tab.url = params.frame.url + (params.frame.urlFragment ?? '');
          // A cross-site navigation swaps the renderer, which silently ends
          // the screencast; start it again on the new page.
          if (tab.id === this.shownTabId) this.restartScreencast(tab);
        }
        break;
      case 'Page.navigatedWithinDocument':
        if (params.frameId === tab.mainFrameId) tab.url = params.url;
        break;
      case 'Page.screencastFrame':
        void this.send('Page.screencastFrameAck', { sessionId: params.sessionId }, tab.sessionId).catch(() => undefined);
        if (tab.id === this.shownTabId) {
          const bytes = Buffer.from(params.data, 'base64');
          const size = imageSize(bytes) ?? { width: tab.width, height: tab.height };
          this.setFrame({
            bytes,
            mime: 'image/jpeg',
            ...size,
            seq: 0,
            cssWidth: params.metadata?.deviceWidth ?? tab.width,
            cssHeight: params.metadata?.deviceHeight ?? tab.height,
          });
        }
        break;
      case 'Page.javascriptDialogOpening': {
        // Nobody can answer a dialog in a headless browser, and an open one
        // freezes the page; accept it and tell the agent it happened.
        const promptText = params.type === 'prompt' ? (params.defaultPrompt ?? '') : undefined;
        void this.send('Page.handleJavaScriptDialog', { accept: true, promptText }, tab.sessionId).catch(() => undefined);
        this.pushConsole(tab, 'warning', `A ${params.type} dialog was shown and accepted automatically: ${String(params.message ?? '').slice(0, 300)}`, 'dialog');
        break;
      }
      case 'Runtime.consoleAPICalled':
        if (params.type === 'error' || params.type === 'warning' || params.type === 'assert') {
          const frame = params.stackTrace?.callFrames?.[0];
          const source = frame ? `${frame.url}:${frame.lineNumber + 1}` : 'console';
          this.pushConsole(tab, params.type === 'warning' ? 'warning' : 'error', summarizeArgs(params.args), source);
        }
        break;
      case 'Runtime.exceptionThrown': {
        const details = params.exceptionDetails ?? {};
        const message = details.exception?.description ?? details.text ?? 'Uncaught exception';
        this.pushConsole(tab, 'error', String(message).split('\n')[0].slice(0, 500), details.url ? `${details.url}:${(details.lineNumber ?? 0) + 1}` : 'page');
        break;
      }
      case 'Log.entryAdded': {
        const entry = params.entry ?? {};
        if (entry.level === 'error' || entry.level === 'warning') {
          this.pushConsole(tab, entry.level, String(entry.text ?? '').slice(0, 500), entry.url ?? entry.source ?? 'browser');
        }
        break;
      }
      default:
        break;
    }
  }

  private pushConsole(tab: Tab, level: 'warning' | 'error', message: string, source: string): void {
    tab.console.push({ level, message, source });
    if (tab.console.length > CONSOLE_KEEP) tab.console.splice(0, tab.console.length - CONSOLE_KEEP);
  }

  private async onAttached(params: CdpResult): Promise<void> {
    const { sessionId, targetInfo } = params;
    if (targetInfo?.type !== 'page') {
      await this.send('Runtime.runIfWaitingForDebugger', {}, sessionId).catch(() => undefined);
      return;
    }
    if (this.byTarget.has(targetInfo.targetId)) return;
    // A page we did not create was opened by a page (target=_blank, window.open).
    // Links open with noopener by default, which hides the opener id, so such
    // a page is taken to come from the tab on screen.
    const opener = (targetInfo.openerId ? this.byTarget.get(targetInfo.openerId) : undefined)
      ?? (this.creating === 0 && this.running && this.tabs.size > 0 ? this.shownTab : undefined);
    const mode = opener?.viewportMode ?? this.config.defaultViewport;
    const size = this.sizeFor(mode);
    let markReady: () => void = () => undefined;
    const ready = new Promise<void>((resolve) => { markReady = resolve; });
    const tab: Tab = {
      id: `tab-${this.nextTab}`,
      targetId: targetInfo.targetId,
      sessionId,
      openedBy: opener?.openedBy ?? null,
      url: targetInfo.url ?? 'about:blank',
      title: targetInfo.title ?? '',
      mainFrameId: null,
      viewportMode: mode,
      width: size.width,
      height: size.height,
      loading: false,
      loadSeq: 0,
      stopWaiters: [],
      console: [],
      lastUsed: Date.now(),
      ready,
    };
    this.nextTab += 1;
    this.tabs.set(tab.id, tab);
    this.byTarget.set(tab.targetId, tab);
    this.bySession.set(sessionId, tab);
    const waiter = this.attachWaiters.get(tab.targetId);
    if (waiter) {
      this.attachWaiters.delete(tab.targetId);
      waiter(tab);
    }
    // Setup is sent first and the page released right behind it, without
    // waiting: a paused page (a popup) may not answer until it runs, and the
    // target handles commands in order, so the setup still lands first.
    const setup = Promise.all([
      this.send('Page.enable', {}, sessionId),
      this.send('Runtime.enable', {}, sessionId),
      this.send('Log.enable', {}, sessionId),
      this.applyViewport(tab),
      this.config.ignoreHttpsErrors
        ? this.send('Security.setIgnoreCertificateErrors', { ignore: true }, sessionId)
        : Promise.resolve(),
      this.send('Page.getFrameTree', {}, sessionId).then((tree: CdpResult) => {
        if (tree?.frameTree?.frame?.id) tab.mainFrameId = tree.frameTree.frame.id;
      }),
    ]);
    const release = this.send('Runtime.runIfWaitingForDebugger', {}, sessionId);
    await Promise.all([setup, release]).catch(() => {
      // the target went away while it was being set up
    });
    markReady();
    // A page that opened this one (target=_blank, window.open): follow it on
    // screen when its opener is the one being watched.
    if (opener && opener.id === this.shownTabId) this.show(tab.id);
  }

  private forget(tab: Tab): void {
    if (!this.tabs.has(tab.id)) return;
    this.tabs.delete(tab.id);
    this.byTarget.delete(tab.targetId);
    this.bySession.delete(tab.sessionId);
    for (const wake of tab.stopWaiters.splice(0)) wake(false);
    if (this.shownTabId === tab.id) {
      this.shownTabId = null;
      const next = [...this.tabs.values()].sort((a, b) => b.lastUsed - a.lastUsed)[0];
      if (next) this.show(next.id);
      else {
        this.frame = null;
        this.touch();
      }
    }
    if (this.tabs.size === 0 && this.conn && !this.conn.isClosed) {
      // The last page closed itself (window.close) or was destroyed; keep this
      // browser and show the start page rather than relaunching it.
      void this.createTab(START_PAGE, null).catch(() => undefined);
    }
  }

  // ---- Tabs ----

  sizeFor(mode: BrowserViewportMode): { width: number; height: number } {
    if (mode === 'fill') return this.panelSize ?? FILL_FALLBACK;
    return VIEWPORTS[mode];
  }

  viewportSummary(tab: Tab): BrowserViewportSummary {
    if (tab.viewportMode === 'fill') return { mode: 'fill', width: null, height: null };
    return { mode: tab.viewportMode, width: tab.width, height: tab.height };
  }

  async applyViewport(tab: Tab): Promise<void> {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width: tab.width,
      height: tab.height,
      deviceScaleFactor: 1,
      mobile: tab.viewportMode === 'mobile',
    }, tab.sessionId);
  }

  async setViewport(tab: Tab, mode: BrowserViewportMode): Promise<void> {
    tab.viewportMode = mode;
    const size = this.sizeFor(mode);
    tab.width = size.width;
    tab.height = size.height;
    await this.applyViewport(tab);
    if (tab.id === this.shownTabId) await this.startScreencast(tab);
  }

  async createTab(url: string, openedBy: string | null, viewport?: BrowserViewportMode): Promise<Tab> {
    await this.trimTabs();
    this.creating += 1;
    let tab: Tab;
    let targetId = '';
    try {
      targetId = (await this.send('Target.createTarget', { url: 'about:blank', background: true })).targetId;
      // The attach event can arrive before or after createTarget answers.
      tab = this.byTarget.get(targetId) ?? await Promise.race([
        new Promise<Tab>((resolve) => { this.attachWaiters.set(targetId, resolve); }),
        sleep(10_000).then((): never => { throw new Error('The new tab did not start.'); }),
      ]);
    } finally {
      // Both reset however the race ends: a waiter left behind would resolve a
      // later attach to the same target that nobody awaits, and a `creating`
      // count stuck above zero stops attributing popups to the tab on screen.
      if (targetId) this.attachWaiters.delete(targetId);
      this.creating -= 1;
    }
    await tab.ready;
    tab.openedBy = openedBy;
    if (viewport && viewport !== tab.viewportMode) await this.setViewport(tab, viewport);
    if (url !== 'about:blank') await this.navigate(tab, url, 30_000);
    if (!this.shownTabId) this.show(tab.id);
    return tab;
  }

  /** Keeps the tab count bounded: closes the least recently used agent tab nobody is looking at. */
  private async trimTabs(): Promise<void> {
    while (this.tabs.size >= this.config.maxTabs) {
      const victim = [...this.tabs.values()]
        .filter((tab) => tab.id !== this.shownTabId)
        .sort((a, b) => a.lastUsed - b.lastUsed)[0];
      if (!victim) return;
      await this.closeTab(victim);
    }
  }

  async closeTab(tab: Tab): Promise<void> {
    if (this.tabs.size === 1) {
      // Keep one page open; an empty browser has nothing to show.
      await this.createTab(START_PAGE, null);
    }
    await this.send('Target.closeTarget', { targetId: tab.targetId }).catch(() => undefined);
    this.forget(tab);
  }

  listTabs(): BrowserTab[] {
    return [...this.tabs.values()].map((tab) => ({
      id: tab.id,
      title: tab.url.startsWith('data:') || tab.title.startsWith('data:') ? 'Server Browser' : tab.title,
      url: tab.url.startsWith('data:') ? 'about:blank' : tab.url,
      active: tab.id === this.shownTabId,
    }));
  }

  // ---- Navigation ----

  /** Resolves `true` once the main frame stops loading, `false` on timeout or
   * when the tab is gone while waiting. */
  waitForStop(tab: Tab, timeoutMs: number): Promise<boolean> {
    if (!tab.loading) return Promise.resolve(true);
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), timeoutMs);
      tab.stopWaiters.push((stopped) => {
        clearTimeout(timer);
        resolve(stopped);
      });
    });
  }

  async navigate(tab: Tab, url: string, timeoutMs: number): Promise<{ settled: boolean }> {
    tab.lastUsed = Date.now();
    tab.console = [];
    const result = await this.send('Page.navigate', { url }, tab.sessionId);
    if (result.errorText) {
      const hint = /CONNECTION_REFUSED|NAME_NOT_RESOLVED|ADDRESS_UNREACHABLE/.test(result.errorText)
        ? ' Nothing answered at that address on the OpenChamber host; check that the dev server is running and the port is right.'
        : '';
      throw new Error(`Could not load ${url}: ${result.errorText}.${hint}`);
    }
    // A same-document navigation (only the #fragment changed) has no loader.
    if (!result.loaderId) return { settled: true };
    tab.loading = true;
    const settled = await this.waitForStop(tab, timeoutMs);
    if (settled) await sleep(POST_LOAD_MS);
    return { settled };
  }

  /**
   * Runs an action that may navigate (a click on a link, Enter in a form) and
   * waits for that load to finish, so the answer describes the page that
   * resulted rather than the one that is leaving.
   */
  async withNavigation<T>(tab: Tab, action: () => Promise<T>, timeoutMs = 10_000): Promise<T> {
    const before = tab.loadSeq;
    const result = await action();
    await sleep(SETTLE_MS);
    if (tab.loadSeq !== before || tab.loading) {
      if (await this.waitForStop(tab, timeoutMs)) await sleep(SETTLE_MS);
    }
    return result;
  }

  async evaluate<T = CdpResult>(tab: Tab, expression: string): Promise<T> {
    const run = () => this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    }, tab.sessionId);
    let result: CdpResult;
    try {
      result = await run();
    } catch (error) {
      // A navigation can destroy the context mid-call; try once more on the new page.
      if (!/context|Cannot find|destroyed/i.test((error as Error).message)) throw error;
      await this.waitForStop(tab, 5_000);
      result = await run();
    }
    if (result.exceptionDetails) {
      const text = result.exceptionDetails.exception?.description ?? result.exceptionDetails.text ?? 'script failed';
      throw new Error(`The page threw: ${String(text).split('\n')[0]}`);
    }
    return result.result?.value as T;
  }

  async pageUrlAndTitle(tab: Tab): Promise<{ url: string; title: string }> {
    const value = await this.evaluate<{ url: string; title: string } | null>(tab, '({ url: String(location.href), title: String(document.title || "") })').catch(() => null);
    if (value) {
      tab.url = value.url;
      tab.title = value.title;
    }
    // The start page is a data: URL; agents see it as a blank page.
    if (tab.url.startsWith('data:')) return { url: 'about:blank', title: 'Server Browser' };
    return { url: tab.url, title: tab.title };
  }

  async evaluateHistory(tab: Tab): Promise<{ currentIndex: number; entries: Array<{ id: number; url: string }> }> {
    const history = await this.send('Page.getNavigationHistory', {}, tab.sessionId);
    return { currentIndex: history.currentIndex ?? 0, entries: history.entries ?? [] };
  }

  async goToHistoryEntry(tab: Tab, entryId: number): Promise<void> {
    await this.send('Page.navigateToHistoryEntry', { entryId }, tab.sessionId);
  }

  async reload(tab: Tab): Promise<void> {
    await this.send('Page.reload', {}, tab.sessionId);
  }

  // ---- Input ----

  async mouseClick(tab: Tab, x: number, y: number): Promise<void> {
    const base = { x, y, button: 'left', clickCount: 1 };
    await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }, tab.sessionId);
    await this.send('Input.dispatchMouseEvent', { ...base, type: 'mousePressed', buttons: 1 }, tab.sessionId);
    await this.send('Input.dispatchMouseEvent', { ...base, type: 'mouseReleased', buttons: 0 }, tab.sessionId);
  }

  async pressEnter(tab: Tab): Promise<void> {
    const key = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 };
    await this.send('Input.dispatchKeyEvent', { ...key, type: 'keyDown', text: '\r', unmodifiedText: '\r' }, tab.sessionId);
    await this.send('Input.dispatchKeyEvent', { ...key, type: 'keyUp' }, tab.sessionId);
  }

  async insertText(tab: Tab, text: string): Promise<void> {
    await this.send('Input.insertText', { text }, tab.sessionId);
  }

  async deleteSelection(tab: Tab): Promise<void> {
    const key = { key: 'Delete', code: 'Delete', windowsVirtualKeyCode: 46, nativeVirtualKeyCode: 46 };
    await this.send('Input.dispatchKeyEvent', { ...key, type: 'rawKeyDown' }, tab.sessionId);
    await this.send('Input.dispatchKeyEvent', { ...key, type: 'keyUp' }, tab.sessionId);
  }

  async screenshot(tab: Tab, format: 'png' | 'jpeg'): Promise<Buffer> {
    const result = await this.send('Page.captureScreenshot', format === 'jpeg'
      ? { format, quality: this.config.screencastQuality }
      : { format }, tab.sessionId);
    return Buffer.from(result.data, 'base64');
  }

  // ---- Surface ----

  /** Puts a tab on screen and streams it. */
  show(tabId: string): void {
    const tab = this.tabs.get(tabId);
    if (!tab) return;
    const previous = this.shownTabId ? this.tabs.get(this.shownTabId) : undefined;
    if (previous && previous.id !== tab.id) {
      void this.send('Page.stopScreencast', {}, previous.sessionId).catch(() => undefined);
    }
    if (previous?.id === tab.id && this.frame) return;
    this.shownTabId = tab.id;
    tab.lastUsed = Date.now();
    void this.send('Target.activateTarget', { targetId: tab.targetId }).catch(() => undefined);
    void this.startScreencast(tab);
  }

  private async startScreencast(tab: Tab): Promise<void> {
    // Streaming counts from the decision to start, not from Chrome's answer: a
    // viewer asking /state right after a frame request must already see it true.
    this.screencastActive = true;
    await this.send('Page.stopScreencast', {}, tab.sessionId).catch(() => undefined);
    // A first picture right away: the screencast only sends a frame when something repaints.
    this.tabFirstSeq = this.seq + 1;
    try {
      const bytes = await this.screenshot(tab, 'jpeg');
      const size = imageSize(bytes) ?? { width: tab.width, height: tab.height };
      if (tab.id === this.shownTabId) {
        this.setFrame({ bytes, mime: 'image/jpeg', ...size, seq: 0, cssWidth: tab.width, cssHeight: tab.height });
      }
    } catch {
      // page still starting; the screencast will deliver
    }
    await this.send('Page.startScreencast', {
      format: 'jpeg',
      quality: this.config.screencastQuality,
      maxWidth: tab.width,
      maxHeight: tab.height,
      everyNthFrame: 1,
    }, tab.sessionId).catch(() => undefined);
  }

  private restartTimer: NodeJS.Timeout | null = null;

  private restartScreencast(tab: Tab): void {
    if (this.restartTimer) clearTimeout(this.restartTimer);
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      if (tab.id !== this.shownTabId || !this.tabs.has(tab.id)) return;
      void (async () => {
        await this.send('Page.stopScreencast', {}, tab.sessionId).catch(() => undefined);
        await this.send('Page.startScreencast', {
          format: 'jpeg',
          quality: this.config.screencastQuality,
          maxWidth: tab.width,
          maxHeight: tab.height,
          everyNthFrame: 1,
        }, tab.sessionId).catch(() => undefined);
      })();
    }, 50);
  }

  private setFrame(frame: Frame): void {
    this.frame = frame;
    this.touch();
  }

  touch(): void {
    this.seq += 1;
    // The frame's seq is written here and nowhere else, so a reader holding the
    // frame always sees the seq it was current for.
    if (this.frame) this.frame.seq = this.seq;
    for (const wake of this.frameWaiters.splice(0)) wake();
  }

  currentFrame(): Frame | null {
    return this.frame;
  }

  /** Waits for a picture newer than `after`; with none drawn yet, for the first one. */
  waitForFrame(after: number, waitMs: number): Promise<void> {
    if (this.seq > after && this.frame) return Promise.resolve();
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, waitMs);
      this.frameWaiters.push(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  markAgentActive(): void {
    const wasActive = Date.now() < this.agentActiveUntil;
    this.agentActiveUntil = Date.now() + 3_000;
    if (!wasActive) this.touch();
    if (this.agentActiveTimer) clearTimeout(this.agentActiveTimer);
    this.agentActiveTimer = setTimeout(() => this.touch(), 3_050);
  }

  /** A viewer asked for the live picture: stream again, and stop again after
   * SCREENCAST_IDLE_MS without such a request — the screencast only pays off
   * when someone is watching, and idle it costs the service thread its frames. */
  markFrameWanted(): void {
    this.frameWantedAt = Date.now();
    const tab = this.shownTab;
    if (!this.screencastActive && tab) void this.startScreencast(tab);
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.idleTimer = null;
      // Only stop when the idle window truly elapsed: the wall clock can jump.
      if (Date.now() - this.frameWantedAt < SCREENCAST_IDLE_MS) return;
      this.screencastActive = false;
      const shown = this.shownTab;
      if (shown) void this.send('Page.stopScreencast', {}, shown.sessionId).catch(() => undefined);
    }, SCREENCAST_IDLE_MS);
    this.idleTimer.unref();
  }

  get streaming(): boolean {
    return this.screencastActive;
  }

  get shownTab(): Tab | undefined {
    return this.shownTabId ? this.tabs.get(this.shownTabId) : undefined;
  }

  async resizeForPanel(width: number, height: number): Promise<{ width: number; height: number }> {
    this.panelSize = {
      width: Math.max(320, Math.min(2560, Math.round(width))),
      height: Math.max(240, Math.min(1600, Math.round(height))),
    };
    const tab = this.shownTab;
    if (!tab) return this.panelSize;
    if (tab.viewportMode === 'fill') await this.setViewport(tab, 'fill');
    return { width: tab.width, height: tab.height };
  }

  /** Maps a point on the picture to the page's CSS pixels. */
  toPage(x: number, y: number): { x: number; y: number } {
    const frame = this.frame;
    if (!frame || !frame.width || !frame.height) return { x, y };
    return { x: (x * frame.cssWidth) / frame.width, y: (y * frame.cssHeight) / frame.height };
  }

  async userPointer(tab: Tab, action: 'down' | 'up' | 'move', px: number, py: number, button: number, buttons: number, modifiers: number): Promise<void> {
    const { x, y } = this.toPage(px, py);
    const name = button === 0 ? 'left' : button === 1 ? 'middle' : button === 2 ? 'right' : 'none';
    if (action === 'move') {
      await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons, modifiers, button: buttons & 1 ? 'left' : 'none' }, tab.sessionId);
      return;
    }
    if (action === 'down') {
      const now = Date.now();
      const near = Math.abs(this.lastDown.x - x) < 6 && Math.abs(this.lastDown.y - y) < 6;
      const count = near && this.lastDown.button === button && now - this.lastDown.at < 500 ? this.lastDown.count + 1 : 1;
      this.lastDown = { at: now, x, y, button, count };
    }
    await this.send('Input.dispatchMouseEvent', {
      type: action === 'down' ? 'mousePressed' : 'mouseReleased',
      x,
      y,
      button: name,
      buttons,
      modifiers,
      clickCount: this.lastDown.count || 1,
    }, tab.sessionId);
  }

  async userWheel(tab: Tab, px: number, py: number, deltaX: number, deltaY: number, modifiers: number): Promise<void> {
    const { x, y } = this.toPage(px, py);
    await this.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX, deltaY, modifiers }, tab.sessionId);
  }

  async dispatchKey(tab: Tab, params: CdpParams): Promise<void> {
    await this.send('Input.dispatchKeyEvent', params, tab.sessionId);
  }
}
