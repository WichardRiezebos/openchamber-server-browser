# Server Browser for OpenChamber

An [OpenChamber](https://github.com/openchamber/openchamber) extension that gives your agents a **real browser on the OpenChamber host**, and lets you watch it live in the side panel and take over with a click.

## Why

When you run OpenChamber on a server and use the **web** UI, the built-in browser panel is an iframe in *your* browser:

- Agents can't drive it (`drivable: false`): only the Electron desktop app can.
- It loads URLs from your machine, so `http://localhost:3000` or `http://app.localhost:3002` point at your laptop, not at the server where the dev stack runs.

Server Browser plugs into OpenChamber's **Browser provider** slot instead. It runs a headless Chromium **next to OpenChamber**, so:

- every `browser.*` action of the agent (open, snapshot, click, type, scroll, back/forward, inspect, capture, resize, close) works, with the same answers the desktop panel gives;
- `localhost` and `*.localhost` mean the server, so dev stacks are reachable without tunnels, hosts files or `--host 0.0.0.0`;
- you see the page live in the rail panel, and you can click into it to take control (log in yourself, fix a form), then hand it back to the agent.

## Requirements

- OpenChamber **2.0.1 or newer** (tested with 2.5.0), web or desktop.
- Chrome or Chromium on the OpenChamber host. The easiest way, as the user that runs OpenChamber:

  ```bash
  npx playwright install chromium
  # missing system libraries on a fresh server? (Debian/Ubuntu)
  sudo npx playwright install-deps chromium
  ```

  A Google Chrome `.deb` or a distro Chromium also works. Snap-packaged Chromium usually does not (it does not pass the debugging pipe on).

No `npm install` is needed for the extension itself: the built files are committed.

## Install

1. In OpenChamber: **Settings → Extensions → Add**, and paste
   `https://github.com/WichardRiezebos/openchamber-server-browser`
   (or clone the repo on the host and add the folder).
2. Approve the **local service** when asked. It runs as your user, like any extension service.
3. **Settings → General → OpenChamber Tools → Browser provider** → choose **Server Browser**.
4. Open **Server Browser** from the context rail to watch.

That's it. The next time an agent uses the browser tool, the page opens on the server and shows up in the panel.

## Using it

- **Watching:** the panel follows the tab the agent works in. A blue dot in the toolbar means the agent is acting; green means you are in control.
- **Taking over:** click, scroll or type on the picture. While you hold control, OpenChamber tells the agent to wait. Press **Hand back to agent** when you're done.
- **Logging in:** let the agent open the login page, then type the password yourself in the panel. Don't paste passwords into the chat.
- **Toolbar:** back / forward / reload, an address bar (`app.localhost:3002` is enough), a tab picker when there is more than one tab, and a viewport picker (Desktop, Tablet, Mobile, Fit panel).
- **Sessions stick:** the browser profile is kept on disk, so a login survives the service's idle restarts.

### Telling your agents

Add something like this to your project's `AGENTS.md`:

```markdown
## Browser testing
- Use the browser tool (browser.open / snapshot / click / type / capture). It runs on the
  OpenChamber host, so dev URLs like http://app.localhost:3002 work as-is.
- Pass the `tabId` that browser.open returns to later actions.
- Never ask for passwords in chat. Open the login page and ask the user to log in in the
  Server Browser panel, then continue when they say so.
```

## Configuration

Optional. Create `~/.config/openchamber-server-browser/config.json` on the host (a `config.json` in the extension folder works too; the one in your home wins). See [`config.example.json`](config.example.json).

| Key | Default | What it does |
| --- | --- | --- |
| `chromePath` | auto-detected | Chrome/Chromium binary to use. |
| `extraArgs` | `[]` | Extra Chrome switches, e.g. `["--host-resolver-rules=MAP *.dev.test 127.0.0.1"]`. |
| `profileDir` | `~/.local/share/openchamber-server-browser/profile` | Where cookies and logins are kept. |
| `defaultViewport` | `"desktop"` | `desktop` (1280×800), `tablet`, `mobile` or `fill` (the panel's size). |
| `ignoreHttpsErrors` | `false` | Accept self-signed certificates of local HTTPS stacks. |
| `maxTabs` | `10` | Older tabs nobody is looking at are closed beyond this. |
| `screencastQuality` | `70` | JPEG quality of the live picture (30–95). |

OpenChamber starts extension services with a minimal environment, which is why settings live in a file and not in environment variables. Changes apply the next time the browser starts (press **Restart** in the toolbar, or wait for the idle stop).

## How it works

```
agent ─ browser tool ─▶ OpenChamber ─ POST /browser-control ─▶ service ─ CDP over a pipe ─▶ headless Chromium
                         │                                       ▲                                │
you ◀── rail panel ◀─────┘ ── /surface/frame, /surface/input ────┘ ◀──── screencast frames ───────┘
```

- `service/` is a small Node HTTP service that OpenChamber starts on demand (and stops after ten idle minutes). It speaks the [browser provider and shared surface contracts](https://github.com/openchamber/openchamber/blob/main/packages/sdk/GUEST_SERVICES.md) from `@openchamber/sdk`.
- Chromium is controlled over `--remote-debugging-pipe`: no debugging port is opened, and Chrome exits when the service does.
- Clicks and typing are sent as real input events (so frameworks see trusted events), falling back to in-page events when an element is covered. Snapshot, scroll and inspect use the same in-page scripts as OpenChamber's own browser panel, so answers match.
- The live picture is Chrome's screencast (JPEG), streamed through OpenChamber's surface viewer; your mouse, wheel, keys and paste are replayed with CDP input events. Cmd+A/C/V/X/Z on a Mac are sent as Ctrl, because the page runs in Chrome on Linux.
- `panel/` is the toolbar docked above the picture.

## Limitations

- One browser and one profile for all chats on the host. Tabs remember which chat opened them, and a chat can only close its own tabs.
- JavaScript dialogs (`alert`, `confirm`, `prompt`) are accepted automatically and reported to the agent in `consoleProblems`.
- Snapshots cover the top document; content inside iframes is not listed.
- No file uploads or downloads yet.

## Development

```bash
npm install            # SDK types and TypeScript, for building only
bun scripts/build.ts   # builds service/main.js and panel/main.js
npm run typecheck
node test/smoke.mjs --chrome /path/to/chrome   # end-to-end test against a real Chromium
```

The smoke test starts the built service the way OpenChamber does, serves a small app on `*.localhost`, and checks every browser action, the tab rules, and the surface (frames, input, copy, resize).

## License

MIT. `service/page-scripts.ts` is adapted from OpenChamber (MIT, © 2025 Bohdan Triapitsyn).
