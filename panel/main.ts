// The toolbar docked above the live picture: back / forward / reload, the
// address of the tab on screen, a tab picker and a viewport picker. It talks to
// the service through the host (`host.serviceRequest`); the picture below it,
// and the person's input on it, belong to the host.
//
// Native <select>s on purpose: their menus open outside this 40 px frame,
// where an in-page popup would be clipped.
import { connectHost } from '@openchamber/sdk';
import { applyHostReady, mountButton } from '@openchamber/sdk/ui';

type TabInfo = { id: string; title: string; url: string; active: boolean };
type State = {
  running: boolean;
  error: string | null;
  url: string;
  title: string;
  loading: boolean;
  viewport: string;
  tabs: TabInfo[];
  controller: 'none' | 'agent' | 'user';
  agentActive: boolean;
};

const host = connectHost();
const root = document.querySelector('#root');
if (!root) throw new Error('Missing root');

const style = document.createElement('style');
style.textContent = `
  .bar { display:flex; align-items:center; gap:4px; height:100%; padding:0 6px; box-sizing:border-box; font: 12px/1.2 var(--font-sans, system-ui, sans-serif); color: var(--foreground, inherit); }
  .addr { flex:1; min-width:60px; height:26px; box-sizing:border-box; padding:0 8px; border-radius:6px;
    border:1px solid var(--border, rgba(127,127,127,.35)); background: var(--input, transparent); color:inherit;
    font: 12px var(--font-mono, ui-monospace, monospace); outline:none; }
  .addr:focus { border-color: var(--ring, #3b82f6); }
  select { height:26px; max-width:140px; border-radius:6px; border:1px solid var(--border, rgba(127,127,127,.35));
    background: var(--input, transparent); color:inherit; font: 12px var(--font-sans, system-ui, sans-serif); padding:0 4px; }
  select option { color: initial; }
  .dot { width:8px; height:8px; border-radius:50%; flex:none; background:#9ca3af; margin:0 2px; }
  .dot.agent { background:#3b82f6; } .dot.user { background:#22c55e; } .dot.error { background:#ef4444; } .dot.loading { animation: pulse 1s infinite; }
  @keyframes pulse { 50% { opacity:.3; } }
  .error { flex:1; color:#ef4444; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
`;
document.head.append(style);

let mounted = false;
host.onReady((context) => {
  applyHostReady(context, document.documentElement);
  if (mounted) return;
  mounted = true;

  const bar = document.createElement('div');
  bar.className = 'bar';
  root.append(bar);

  const post = async (path: string, body: Record<string, unknown> = {}): Promise<void> => {
    try {
      await host.serviceRequest({ method: 'POST', path, body: JSON.stringify(body) });
    } catch {
      // the service starts on demand; the next refresh shows what happened
    }
    void refresh();
  };

  const dot = document.createElement('span');
  dot.className = 'dot';
  bar.append(dot);
  mountButton(bar, { label: '‹', size: 'xs', variant: 'ghost', onClick: () => { void post('/nav', { action: 'back' }); } });
  mountButton(bar, { label: '›', size: 'xs', variant: 'ghost', onClick: () => { void post('/nav', { action: 'forward' }); } });
  mountButton(bar, { label: '↻', size: 'xs', variant: 'ghost', onClick: () => { void post('/nav', { action: 'reload' }); } });

  const address = document.createElement('input');
  address.className = 'addr';
  address.placeholder = 'http://app.localhost:3000';
  address.spellcheck = false;
  address.autocapitalize = 'off';
  let editing = false;
  address.addEventListener('focus', () => { editing = true; address.select(); });
  address.addEventListener('blur', () => { editing = false; });
  address.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && address.value.trim()) {
      editing = false;
      address.blur();
      void post('/navigate', { url: address.value.trim() });
    } else if (event.key === 'Escape') {
      editing = false;
      address.blur();
      void refresh();
    }
  });
  bar.append(address);

  const errorText = document.createElement('span');
  errorText.className = 'error';
  errorText.hidden = true;
  bar.append(errorText);
  const restartWrap = document.createElement('span');
  restartWrap.hidden = true;
  bar.append(restartWrap);
  mountButton(restartWrap, { label: 'Restart', size: 'xs', variant: 'outline', onClick: () => { void post('/restart'); } });

  const tabs = document.createElement('select');
  tabs.title = 'Tabs';
  tabs.addEventListener('change', () => { void post('/tab', { id: tabs.value }); });
  bar.append(tabs);

  const viewport = document.createElement('select');
  viewport.title = 'Viewport';
  for (const [value, label] of [['desktop', 'Desktop'], ['tablet', 'Tablet'], ['mobile', 'Mobile'], ['fill', 'Fit panel']]) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    viewport.append(option);
  }
  viewport.addEventListener('change', () => { void post('/viewport', { mode: viewport.value }); });
  bar.append(viewport);

  const render = (state: State): void => {
    const failed = Boolean(state.error) && !state.running;
    dot.className = `dot ${failed ? 'error' : state.controller === 'user' ? 'user' : state.agentActive ? 'agent' : ''}${state.loading ? ' loading' : ''}`;
    dot.title = failed ? 'Browser not running' : state.controller === 'user' ? 'You are in control' : state.agentActive ? 'Agent is working' : 'Idle';
    address.hidden = failed;
    errorText.hidden = !failed;
    errorText.textContent = state.error ?? '';
    errorText.title = state.error ?? '';
    restartWrap.hidden = !failed;
    if (!editing && address.value !== state.url) address.value = state.url;

    const signature = state.tabs.map((tab) => `${tab.id}|${tab.title}|${tab.active}`).join('\n');
    if (tabs.dataset.signature !== signature) {
      tabs.dataset.signature = signature;
      tabs.replaceChildren(...state.tabs.map((tab) => {
        const option = document.createElement('option');
        option.value = tab.id;
        option.textContent = (tab.title || tab.url || tab.id).slice(0, 60);
        option.selected = tab.active;
        return option;
      }));
    }
    tabs.hidden = state.tabs.length < 2;
    viewport.value = state.viewport;
  };

  const refresh = async (): Promise<void> => {
    try {
      const result = await host.serviceRequest({ method: 'GET', path: '/state' });
      if (result.status === 200) render(JSON.parse(result.body) as State);
    } catch {
      // service not started yet
    }
  };
  void refresh();
  setInterval(() => { void refresh(); }, 1000);
});
