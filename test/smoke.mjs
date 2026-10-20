// End-to-end smoke test: starts the built service the way OpenChamber does
// (port + token in a minimal env), serves a small app on *.localhost, and drives
// every browser action plus the shared surface against it.
//
//   node test/smoke.mjs [--chrome /path/to/chrome] [--arg=--some-switch ...]
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const chromeFlag = argv.indexOf('--chrome');
const chromePath = chromeFlag !== -1 ? argv[chromeFlag + 1] : undefined;
const extraArgs = argv.filter((arg) => arg.startsWith('--arg=')).map((arg) => arg.slice(6));

let failures = 0;
const check = (name, condition, detail) => {
  if (condition) console.log(`  ok   ${name}`);
  else {
    failures += 1;
    console.log(`  FAIL ${name}${detail === undefined ? '' : ` — ${typeof detail === 'string' ? detail : JSON.stringify(detail).slice(0, 400)}`}`);
  }
};

// ---- A tiny app, like a dev stack ----
const page = (title, body) => `<!doctype html><html><head><title>${title}</title><meta name="viewport" content="width=device-width"></head><body>${body}</body></html>`;
const app = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (url.pathname === '/') {
    res.end(page('Inloggen', `
      <h1>Inloggen</h1>
      <form action="/dashboard" method="get">
        <label>Relatie-ID <input id="relatie" name="relatie" autocomplete="off"></label>
        <label>Wachtwoord <input id="pw" name="pw" type="password"></label>
        <button type="submit">Inloggen</button>
      </form>
      <a href="/about">Over</a>
      <a href="/about" target="_blank" id="popup">Nieuw venster</a>
      <div style="height:3000px"></div><p id="bottom">Einde</p>
      <script>console.error('test error from page'); document.querySelector('#relatie').addEventListener('input', e => document.title = 'typed:' + e.target.value);</script>`));
  } else if (url.pathname === '/dashboard') {
    res.end(page('Dashboard', `<h1>Welkom ${url.searchParams.get('relatie') ?? ''}</h1><button id="danger" onclick="document.body.dataset.ok = confirm('Zeker?')">Verwijder</button>`));
  } else if (url.pathname === '/about') {
    res.end(page('Over', '<h1>Over ons</h1><p style="color: rgb(200, 0, 0); font-size: 40px" id="red">Rood</p><button id="kleur" onclick="red.textContent = \'Groen\'; red.style.color = \'green\'">Kleur</button>'));
  } else {
    res.statusCode = 404;
    res.end(page('404', 'not found'));
  }
});
await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
const appPort = app.address().port;
const base = `http://erp.285.groem.localhost:${appPort}`;

// ---- The service, started like OpenChamber starts it ----
const home = mkdtempSync(path.join(os.tmpdir(), 'osb-home-'));
mkdirSync(path.join(home, '.config', 'openchamber-server-browser'), { recursive: true });
writeFileSync(path.join(home, '.config', 'openchamber-server-browser', 'config.json'), JSON.stringify({
  ...(chromePath ? { chromePath } : {}),
  extraArgs,
}));
const servicePort = 20000 + Math.floor(Math.random() * 20000);
const token = randomBytes(16).toString('hex');
const service = spawn(process.execPath, [path.join(root, 'service', 'main.js')], {
  env: { PATH: process.env.PATH, HOME: home, TMPDIR: os.tmpdir(), OPENCHAMBER_SERVICE_PORT: String(servicePort), OPENCHAMBER_SERVICE_TOKEN: token },
  stdio: ['ignore', 'inherit', 'inherit'],
});

const call = async (method, pathname, body, headers = {}) => {
  const res = await fetch(`http://127.0.0.1:${servicePort}${pathname}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return res;
};
let requestNo = 0;
const act = async (action, parameters = {}, sessionId = 'ses_test') => {
  requestNo += 1;
  const res = await call('POST', '/browser-control', { requestId: `browser-${requestNo}`, action, parameters, context: { directory: '/tmp/project', sessionId } });
  return res.json();
};

try {
  for (let i = 0; i < 50; i += 1) {
    try {
      if ((await call('GET', '/health')).status === 200) break;
    } catch { /* not up yet */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  console.log('service');
  check('health answers', (await call('GET', '/health')).status === 200);
  check('wrong token refused', (await fetch(`http://127.0.0.1:${servicePort}/health`, { headers: { Authorization: 'Bearer nope' } })).status === 401);

  console.log('agent actions');
  const open = await act('browser.open', { url: `${base}/` });
  check('open loads a *.localhost dev URL', open.ok && open.data.title === 'Inloggen' && open.data.settled === true, open);
  check('open answers a tabId and viewport', open.ok && typeof open.data.tabId === 'string' && open.data.viewport?.mode === 'desktop', open);
  const tabId = open.data?.tabId;

  const snap = await act('browser.snapshot', { tabId });
  check('snapshot lists the form fields', snap.ok && snap.data.elements.some((el) => el.selector === '#relatie'), snap);
  check('snapshot reports console errors', snap.ok && snap.data.consoleProblems?.some((p) => p.message.includes('test error from page')), snap.data?.consoleProblems);
  check('snapshot lists tabs with the active one', snap.ok && snap.data.tabs?.some((t) => t.id === tabId && t.active), snap.data?.tabs);

  const typed = await act('browser.type', { tabId, selector: '#relatie', value: '1954', submit: false });
  check('type fills a field with real input events', typed.ok && typed.data.selector === '#relatie', typed);
  const afterType = await act('browser.snapshot', { tabId });
  check('input listeners saw the typing', afterType.ok && afterType.data.title === 'typed:1954', afterType.data?.title);
  const retyped = await act('browser.type', { tabId, selector: '#relatie', value: '285', submit: false });
  const afterRetype = await act('browser.snapshot', { tabId });
  check('typing again replaces the value', retyped.ok && afterRetype.data.title === 'typed:285', afterRetype.data?.title);

  const submit = await act('browser.type', { tabId, selector: '#pw', value: 'secret', submit: true });
  check('type with submit follows the form to the next page', submit.ok && submit.data.url.includes('/dashboard?relatie=285'), submit);

  const clickDanger = await act('browser.click', { tabId, text: 'Verwijder' });
  check('click by label works', clickDanger.ok && clickDanger.data.clicked === '#danger', clickDanger);
  const afterConfirm = await act('browser.snapshot', { tabId });
  check('confirm dialogs are accepted and reported', afterConfirm.ok && afterConfirm.data.consoleProblems?.some((p) => p.source === 'dialog'), afterConfirm.data?.consoleProblems);

  const back = await act('browser.back', { tabId });
  check('back returns to the login page', back.ok && back.data.title === 'Inloggen', back);
  const forward = await act('browser.forward', { tabId });
  check('forward goes to the dashboard again', forward.ok && forward.data.title === 'Dashboard', forward);
  await act('browser.back', { tabId });

  const scroll = await act('browser.scroll', { tabId, direction: 'bottom' });
  check('scroll to bottom reports position', scroll.ok && scroll.data.atBottom === true && scroll.data.scrollY > 1000, scroll);
  const scrollTo = await act('browser.scroll', { tabId, selector: '#relatie' });
  check('scroll to an element', scrollTo.ok && scrollTo.data.scrolledTo === '#relatie', scrollTo);

  const link = await act('browser.click', { tabId, text: 'Over' });
  check('click a link navigates and waits for the page', link.ok && link.data.url.endsWith('/about'), link);
  const inspect = await act('browser.inspect', { tabId, selector: '#red' });
  check('inspect returns computed styles', inspect.ok && inspect.data.styles.color === 'rgb(200, 0, 0)', inspect);

  const capture = await act('browser.capture', { tabId });
  const png = capture.ok ? Buffer.from(capture.data.base64, 'base64') : Buffer.alloc(0);
  check('capture returns a PNG of the viewport', capture.ok && png.toString('ascii', 1, 4) === 'PNG' && capture.data.width === 1280, capture.ok ? { w: capture.data.width, bytes: png.length } : capture);

  const resize = await act('browser.resize', { tabId, viewport: 'mobile' });
  check('resize to mobile', resize.ok && resize.data.viewport.width === 390, resize);
  const width = await act('browser.inspect', { tabId, selector: 'body' });
  check('the page lays out at the new width', width.ok && Math.round(width.data.bounds.width) <= 390, width.data?.bounds);
  await act('browser.resize', { tabId, viewport: 'desktop' });

  const missing = await act('browser.click', { tabId, selector: '#nope' });
  check('a missing element is an actionable error', !missing.ok && missing.error.includes('No element matches #nope'), missing);
  const badTab = await act('browser.snapshot', { tabId: 'tab-999' });
  check('an unknown tabId is refused', !badTab.ok && badTab.error.includes('tab-999'), badTab);
  const refused = await act('browser.open', { url: 'http://nothing.localhost:1/' });
  check('a dead dev server is explained', !refused.ok && /CONNECTION_REFUSED|UNSAFE_PORT/.test(refused.error), refused);

  console.log('tabs');
  await act('browser.back', { tabId });
  const popup = await act('browser.click', { tabId, selector: '#popup' });
  await new Promise((resolve) => setTimeout(resolve, 800));
  const tabsNow = await act('browser.snapshot', {});
  check('target=_blank opens a tab that is followed on screen', popup.ok && tabsNow.ok && tabsNow.data.title === 'Over' && tabsNow.data.tabs.length >= 3, tabsNow.data?.tabs);
  const second = await act('browser.open', { url: `${base}/about` }, 'ses_other');
  const closeOther = await act('browser.close', { tabId: second.data?.tabId }, 'ses_test');
  check('a chat cannot close another chat\'s tab', !closeOther.ok, closeOther);
  const closeOwn = await act('browser.close', {}, 'ses_other');
  check('a chat closes its own most recent tab', closeOwn.ok && closeOwn.data.tabId === second.data?.tabId, closeOwn);

  console.log('surface');
  const frame = await call('GET', '/surface/frame?after=0&wait=1000');
  const frameBytes = Buffer.from(await frame.arrayBuffer());
  check('a frame is served as JPEG with surface headers', frame.status === 200 && frame.headers.get('content-type') === 'image/jpeg'
    && Number(frame.headers.get('x-surface-width')) > 0 && frameBytes[0] === 0xff, { status: frame.status, headers: Object.fromEntries(frame.headers) });
  const seq = Number(frame.headers.get('x-surface-seq'));
  const idle = await call('GET', `/surface/frame?after=${seq + 1000}&wait=300`);
  check('no newer frame answers 204', idle.status === 204, idle.status);

  // The live picture follows the page: a repaint after a cross-site load arrives as a new frame.
  const live = await act('browser.open', { url: `http://other.localhost:${appPort}/about` });
  await new Promise((resolve) => setTimeout(resolve, 600));
  const before = Buffer.from(await (await call('GET', '/surface/frame?after=0&wait=1000')).arrayBuffer());
  // A click repaints the page without any screenshot of ours: only the screencast can deliver it.
  await act('browser.click', { tabId: live.data?.tabId, selector: '#kleur' });
  await new Promise((resolve) => setTimeout(resolve, 800));
  const after = await call('GET', '/surface/frame?after=0&wait=1000');
  const afterBytes = Buffer.from(await after.arrayBuffer());
  check('the live picture updates when the page repaints', after.status === 200 && !afterBytes.equals(before), { status: after.status, same: afterBytes.equals(before) });
  await act('browser.close', { tabId: live.data?.tabId });

  // The person takes over: show the login tab, click the field, paste text.
  await call('POST', '/surface/control', { controller: 'user', viewer: 'v1' });
  await call('POST', '/tab', { id: tabId });
  await new Promise((resolve) => setTimeout(resolve, 500));
  const shown = await (await call('GET', '/surface/frame?after=0&wait=1000')).arrayBuffer();
  void shown;
  const state = await (await call('GET', '/state')).json();
  check('dock state follows the shown tab', state.url.endsWith('/') && state.controller === 'user', state);
  const loc = await act('browser.inspect', { tabId, selector: '#relatie' });
  const mods = { alt: false, ctrl: false, meta: false, shift: false };
  const cx = loc.data.bounds.x + loc.data.bounds.width / 2;
  const cy = loc.data.bounds.y + loc.data.bounds.height / 2;
  const frameSeq = (await call('GET', '/surface/frame?after=0&wait=10')).headers.get('x-surface-seq');
  const input = await call('POST', '/surface/input', { events: [
    { type: 'pointer', action: 'down', x: cx, y: cy, button: 0, buttons: 1, modifiers: mods },
    { type: 'pointer', action: 'up', x: cx, y: cy, button: 0, buttons: 0, modifiers: mods },
    { type: 'key', action: 'down', key: 'a', code: 'KeyA', modifiers: { ...mods, meta: true } },
    { type: 'key', action: 'up', key: 'a', code: 'KeyA', modifiers: { ...mods, meta: true } },
    { type: 'text', text: 'handmatig' },
    { type: 'key', action: 'down', key: '!', code: 'Digit1', modifiers: { ...mods, shift: true } },
    { type: 'key', action: 'up', key: '!', code: 'Digit1', modifiers: { ...mods, shift: true } },
  ] }, { 'x-surface-viewer': 'v1', 'x-surface-frame-seq': frameSeq });
  check('surface input is accepted', input.status === 204, input.status);
  const typedByUser = await act('browser.snapshot', { tabId });
  check('pointer, Cmd+A, paste and keys reach the page', typedByUser.ok && typedByUser.data.title === 'typed:handmatig!', typedByUser.data?.title);
  const stale = await call('POST', '/surface/input', { events: [] }, { 'x-surface-frame-seq': '1' });
  check('input on a picture of another tab is refused', stale.status === 409, stale.status);
  // Select the field's text and copy it out.
  await call('POST', '/surface/input', { events: [
    { type: 'key', action: 'down', key: 'a', code: 'KeyA', modifiers: { ...mods, ctrl: true } },
    { type: 'key', action: 'up', key: 'a', code: 'KeyA', modifiers: { ...mods, ctrl: true } },
  ] }, { 'x-surface-viewer': 'v1' });
  const clip = await (await call('GET', '/surface/clipboard')).json();
  check('copy returns the selected text', clip.text === 'handmatig!', clip);
  const blocked = await call('POST', '/navigate', { url: `${base}/about` }, { 'x-surface-viewer': 'v2' });
  check('another viewer\'s dock cannot drive while someone is in control', blocked.status === 409, blocked.status);
  await call('POST', '/surface/control', { controller: 'none' });

  const resized = await call('POST', '/surface/resize', { width: 900, height: 600 });
  check('resize keeps a fixed viewport size', resized.status === 200 && (await resized.json()).width === 1280);
  await call('POST', '/viewport', { mode: 'fill' });
  const fill = await (await call('POST', '/surface/resize', { width: 900, height: 600 })).json();
  check('fill follows the panel size', fill.width === 900 && fill.height === 600, fill);
  const dockNav = await (await call('POST', '/navigate', { url: `erp.285.groem.localhost:${appPort}/about` })).json();
  await new Promise((resolve) => setTimeout(resolve, 800));
  const afterDock = await (await call('GET', '/state')).json();
  check('the address bar accepts a bare *.localhost address', dockNav.ok && afterDock.url.endsWith('/about'), afterDock.url);
} catch (error) {
  failures += 1;
  console.log(`  FAIL unexpected error — ${error.stack}`);
} finally {
  service.kill('SIGTERM');
  await new Promise((resolve) => setTimeout(resolve, 1500));
  app.close();
  rmSync(home, { recursive: true, force: true });
}

console.log(failures === 0 ? '\nall checks passed' : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
