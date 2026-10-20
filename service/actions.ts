// The agent's `browser.*` actions, answered from the server-side Chrome.
//
// Shapes follow `@openchamber/sdk` exactly (the same ones the desktop app's
// browser panel answers), so an agent sees no difference between the two.
import type {
  BrowserProviderRequest,
  BrowserProviderResult,
  BrowserSnapshotData,
} from '@openchamber/sdk';

import type { ServerBrowser, Tab } from './browser.ts';
import {
  buildClickScript,
  buildFocusFieldScript,
  buildInspectScript,
  buildLocateScript,
  buildReadFieldScript,
  buildScrollScript,
  buildSnapshotScript,
  buildTypeScript,
} from './page-scripts.ts';

type ScriptAnswer = { ok: true; [key: string]: unknown } | { ok: false; error: string };

const fail = (error: string): BrowserProviderResult => ({ ok: false, error });

const withoutOk = (answer: Record<string, unknown>): Record<string, unknown> => {
  const { ok: _ok, ...rest } = answer;
  return rest;
};

const NO_TAB = 'No page is open yet. Use browser.open with a URL first.';

/** The tab an action is for: the one named, or the one on screen. */
const resolveTab = (browser: ServerBrowser, tabId: string | undefined): Tab | string => {
  if (tabId !== undefined) {
    const tab = browser.tabs.get(tabId);
    return tab ?? `There is no tab ${tabId}. Use an id from the tabs list in browser.snapshot, or omit tabId for the page on screen.`;
  }
  return browser.shownTab ?? NO_TAB;
};

/** The person watching sees what the agent works on, unless they are driving themselves. */
const follow = (browser: ServerBrowser, tab: Tab): void => {
  if (browser.controller !== 'user' && browser.shownTabId !== tab.id) browser.show(tab.id);
};

const runScript = async (browser: ServerBrowser, tab: Tab, script: string): Promise<ScriptAnswer> => {
  const answer = await browser.evaluate<ScriptAnswer | null>(tab, script);
  return answer ?? { ok: false, error: 'The page did not answer; it may still be loading. Try again.' };
};

export const handleAction = async (browser: ServerBrowser, request: BrowserProviderRequest): Promise<BrowserProviderResult> => {
  await browser.ensure();
  browser.markAgentActive();
  const caller = request.context.sessionId;

  if (request.action === 'browser.open') {
    const { url, viewport, tabId } = request.parameters;
    if (tabId !== undefined) {
      const tab = browser.tabs.get(tabId);
      if (!tab) return fail(`There is no tab ${tabId}. Omit tabId to open the page in a new tab.`);
      if (viewport && viewport !== tab.viewportMode) await browser.setViewport(tab, viewport);
      follow(browser, tab);
      const { settled } = await browser.navigate(tab, url, 30_000);
      const page = await browser.pageUrlAndTitle(tab);
      return { ok: true, data: { tabId: tab.id, ...page, opened: true, settled, viewport: browser.viewportSummary(tab) } };
    }
    const tab = await browser.createTab('about:blank', caller, viewport ?? browser.config.defaultViewport);
    follow(browser, tab);
    try {
      const { settled } = await browser.navigate(tab, url, 30_000);
      const page = await browser.pageUrlAndTitle(tab);
      return { ok: true, data: { tabId: tab.id, ...page, opened: true, settled, viewport: browser.viewportSummary(tab) } };
    } catch (error) {
      await browser.closeTab(tab);
      throw error;
    }
  }

  const resolved = resolveTab(browser, request.parameters.tabId);
  if (typeof resolved === 'string') {
    // browser.close names its own rule below; every other action needs a page.
    if (request.action !== 'browser.close') return fail(resolved);
  }
  const target = typeof resolved === 'string' ? undefined : resolved;
  if (target) target.lastUsed = Date.now();

  switch (request.action) {
    case 'browser.snapshot': {
      const tab = target as Tab;
      const answer = await runScript(browser, tab, buildSnapshotScript({ selector: request.parameters.selector }));
      if (!answer.ok) return fail(answer.error);
      const data = withoutOk(answer) as unknown as BrowserSnapshotData;
      if (data.url.startsWith('data:')) {
        data.url = 'about:blank';
        data.title = 'Server Browser';
      }
      data.viewport = browser.viewportSummary(tab);
      if (tab.console.length > 0) data.consoleProblems = tab.console.slice(-15);
      data.tabs = browser.listTabs();
      return { ok: true, data };
    }

    case 'browser.click': {
      const tab = target as Tab;
      follow(browser, tab);
      const { selector, text } = request.parameters;
      const located = await runScript(browser, tab, buildLocateScript({ selector, text }));
      if (!located.ok) return fail(located.error);
      if (located.covered) {
        // Something is drawn over the element; a real click would hit that
        // instead, so dispatch the click on the element the agent named.
        const clicked = await browser.withNavigation(tab, () => runScript(browser, tab, buildClickScript({ selector, text })));
        if (!clicked.ok) return fail(clicked.error);
      } else {
        await browser.withNavigation(tab, () => browser.mouseClick(tab, Number(located.x), Number(located.y)));
      }
      const { url } = await browser.pageUrlAndTitle(tab);
      return { ok: true, data: { clicked: String(located.selector), label: String(located.label ?? ''), url } };
    }

    case 'browser.type': {
      const tab = target as Tab;
      follow(browser, tab);
      const { selector, value, submit } = request.parameters;
      const focused = await runScript(browser, tab, buildFocusFieldScript({ selector }));
      if (!focused.ok) return fail(focused.error);
      if (value === '') await browser.deleteSelection(tab);
      else await browser.insertText(tab, value);
      const now = await browser.evaluate<string | null>(tab, buildReadFieldScript({ selector })).catch(() => null);
      if (now !== null && now !== value) {
        // Real typing did not land (a field that rewrites its own input);
        // set the value the way frameworks observe instead.
        const set = await runScript(browser, tab, buildTypeScript({ selector, value, submit: false }));
        if (!set.ok) return fail(set.error);
      }
      if (submit) await browser.withNavigation(tab, () => browser.pressEnter(tab));
      const { url } = await browser.pageUrlAndTitle(tab);
      return { ok: true, data: { selector: String(focused.selector), url } };
    }

    case 'browser.scroll': {
      const tab = target as Tab;
      follow(browser, tab);
      const answer = await runScript(browser, tab, buildScrollScript(request.parameters));
      if (!answer.ok) return fail(answer.error);
      return { ok: true, data: withoutOk(answer) as never };
    }

    case 'browser.back':
    case 'browser.forward': {
      const tab = target as Tab;
      follow(browser, tab);
      const history = await browser.evaluateHistory(tab);
      const index = history.currentIndex + (request.action === 'browser.back' ? -1 : 1);
      const entry = history.entries[index];
      if (!entry) return fail(`There is nothing to go ${request.action === 'browser.back' ? 'back' : 'forward'} to in this tab`);
      await browser.withNavigation(tab, () => browser.goToHistoryEntry(tab, entry.id));
      return { ok: true, data: await browser.pageUrlAndTitle(tab) };
    }

    case 'browser.inspect': {
      const tab = target as Tab;
      const answer = await runScript(browser, tab, buildInspectScript({ selector: request.parameters.selector }));
      if (!answer.ok) return fail(answer.error);
      return { ok: true, data: withoutOk(answer) as never };
    }

    case 'browser.capture': {
      const tab = target as Tab;
      const bytes = await browser.screenshot(tab, 'png');
      const page = await browser.pageUrlAndTitle(tab);
      return {
        ok: true,
        data: {
          base64: bytes.toString('base64'),
          mime: 'image/png',
          width: tab.width,
          height: tab.height,
          ...page,
          viewport: browser.viewportSummary(tab),
        },
      };
    }

    case 'browser.resize': {
      const tab = target as Tab;
      follow(browser, tab);
      await browser.setViewport(tab, request.parameters.viewport);
      return { ok: true, data: { viewport: browser.viewportSummary(tab) } };
    }

    case 'browser.close': {
      if (!caller) return fail('Only a tab an agent chat opened can be closed, and this call came from no chat.');
      let tab: Tab | undefined;
      if (request.parameters.tabId !== undefined) {
        tab = browser.tabs.get(request.parameters.tabId);
        if (!tab) return fail(`There is no tab ${request.parameters.tabId}.`);
        if (tab.openedBy !== caller) return fail(`Tab ${tab.id} was not opened by this chat; it is left open.`);
      } else {
        tab = [...browser.tabs.values()]
          .filter((candidate) => candidate.openedBy === caller)
          .sort((a, b) => b.lastUsed - a.lastUsed)[0];
        if (!tab) return fail('This chat has no open tab to close.');
      }
      await browser.closeTab(tab);
      return { ok: true, data: { closed: true, tabId: tab.id } };
    }

    default:
      return fail('Unknown action');
  }
};
