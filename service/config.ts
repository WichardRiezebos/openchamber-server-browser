// Settings and browser discovery.
//
// OpenChamber starts the service with an allowlisted environment (PATH, HOME,
// temp, locale), so nothing can be configured through env vars. Settings live
// in a JSON file instead: `config.json` next to `package.json`, then
// `~/.config/openchamber-server-browser/config.json` (later wins).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { BrowserViewportMode } from '@openchamber/sdk';

export type Config = {
  /** Absolute path to a Chrome/Chromium binary. Found automatically when absent. */
  chromePath?: string;
  /** Extra command-line switches for Chrome, appended after the defaults. */
  extraArgs: string[];
  /** Persistent profile, so a login survives the service's idle restarts. */
  profileDir: string;
  /** Viewport new tabs open with when the agent names none. */
  defaultViewport: BrowserViewportMode;
  /** Accept self-signed certificates (local HTTPS dev stacks). */
  ignoreHttpsErrors: boolean;
  /** Oldest agent tabs are closed beyond this many. */
  maxTabs: number;
  /** JPEG quality of the live picture, 30–95. */
  screencastQuality: number;
};

const VIEWPORT_MODES: ReadonlySet<string> = new Set(['mobile', 'tablet', 'desktop', 'fill']);

const packageRoot = (): string => path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const userConfigPath = (): string => path.join(os.homedir(), '.config', 'openchamber-server-browser', 'config.json');

const readJson = (file: string): Record<string, unknown> => {
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch (error) {
    // A missing file is the normal case; anything else (bad JSON, no read
    // permission) would otherwise silently pass as empty settings.
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn(`openchamber-server-browser: ignoring ${file}: ${(error as Error).message}`);
    }
    return {};
  }
};

const expandHome = (value: string): string => (value.startsWith('~/') ? path.join(os.homedir(), value.slice(2)) : value);

export const loadConfig = (): Config => {
  const merged = { ...readJson(path.join(packageRoot(), 'config.json')), ...readJson(userConfigPath()) };
  const config: Config = {
    extraArgs: [],
    profileDir: path.join(os.homedir(), '.local', 'share', 'openchamber-server-browser', 'profile'),
    defaultViewport: 'desktop',
    ignoreHttpsErrors: false,
    maxTabs: 10,
    screencastQuality: 70,
  };
  if (typeof merged.chromePath === 'string' && merged.chromePath) config.chromePath = expandHome(merged.chromePath);
  if (Array.isArray(merged.extraArgs)) config.extraArgs = merged.extraArgs.filter((arg): arg is string => typeof arg === 'string');
  if (typeof merged.profileDir === 'string' && merged.profileDir) config.profileDir = expandHome(merged.profileDir);
  if (typeof merged.defaultViewport === 'string' && VIEWPORT_MODES.has(merged.defaultViewport)) {
    config.defaultViewport = merged.defaultViewport as BrowserViewportMode;
  }
  if (typeof merged.ignoreHttpsErrors === 'boolean') config.ignoreHttpsErrors = merged.ignoreHttpsErrors;
  if (typeof merged.maxTabs === 'number' && merged.maxTabs >= 1) config.maxTabs = Math.floor(merged.maxTabs);
  if (typeof merged.screencastQuality === 'number') config.screencastQuality = Math.max(30, Math.min(95, Math.round(merged.screencastQuality)));
  return config;
};

const isExecutable = (file: string): boolean => {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
};

/** Newest first, so a fresh `playwright install` wins over an old one. */
const playwrightBrowsers = (): string[] => {
  const roots = [
    path.join(os.homedir(), '.cache', 'ms-playwright'),
    path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright'),
  ];
  const found: string[] = [];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    const dirs = readdirSync(root)
      .filter((name) => name.startsWith('chromium'))
      .sort((a, b) => {
        const rev = (name: string) => Number(name.split('-').pop()) || 0;
        return rev(b) - rev(a);
      });
    for (const dir of dirs) {
      const base = path.join(root, dir);
      for (const candidate of [
        'chrome-linux64/chrome',
        'chrome-linux/chrome',
        'chrome-headless-shell-linux64/chrome-headless-shell',
        'chrome-linux/headless_shell',
        'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
        'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
      ]) {
        found.push(path.join(base, candidate));
      }
    }
  }
  return found;
};

const onPath = (names: string[]): string[] => {
  const dirs = (process.env.PATH ?? '').split(path.delimiter).filter(Boolean);
  return names.flatMap((name) => dirs.map((dir) => path.join(dir, name)));
};

export const findChrome = (config: Config): { path: string } | { error: string } => {
  if (config.chromePath) {
    return isExecutable(config.chromePath)
      ? { path: config.chromePath }
      : { error: `chromePath ${config.chromePath} from the config file does not exist.` };
  }
  // Playwright's builds first: they are plain binaries, while a distro
  // `chromium` is often a snap wrapper that does not pass the debugging pipe on.
  const candidates = [
    ...playwrightBrowsers(),
    ...onPath(['google-chrome-stable', 'google-chrome', 'chromium', 'chromium-browser', 'chrome']),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/snap/bin/chromium',
  ];
  const hit = candidates.find(isExecutable);
  if (hit) return { path: hit };
  return {
    error: 'No Chrome or Chromium found on the OpenChamber host. Install one (e.g. `npx playwright install chromium` '
      + `as the user running OpenChamber) or set "chromePath" in ${userConfigPath()}.`,
  };
};
