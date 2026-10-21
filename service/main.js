// Built from service/*.ts by scripts/build.ts. Edit the sources, not this file.
// service/main.ts
import http from "node:http";
// node_modules/@openchamber/sdk/dist/scrollbar-style.js
var GUEST_SCROLLING_ATTRIBUTE = "data-oc-scrolling";
var GUEST_SCROLLBAR_CSS = `
:root {
  /* Quiet at rest like the app's own thumbs; hover gives a clear grab target. */
  --oc-scrollbar-thumb: color-mix(in srgb, var(--oc-muted, currentColor) 18%, transparent);
  --oc-scrollbar-thumb-hover: color-mix(in srgb, var(--oc-muted, currentColor) 36%, transparent);
  scrollbar-gutter: stable;
}
* {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
:hover, [${GUEST_SCROLLING_ATTRIBUTE}] {
  scrollbar-color: var(--oc-scrollbar-thumb) transparent;
}
/* Chromium's standard scrollbar properties otherwise override its pseudo-elements. */
@supports selector(::-webkit-scrollbar) {
  *, :hover, [${GUEST_SCROLLING_ATTRIBUTE}] { scrollbar-width: auto; scrollbar-color: auto; }
  ::-webkit-scrollbar { width: 6px; height: 6px; background: transparent; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 999px;
    min-width: 24px;
    min-height: 24px;
  }
  :hover::-webkit-scrollbar-thumb, [${GUEST_SCROLLING_ATTRIBUTE}]::-webkit-scrollbar-thumb { background: var(--oc-scrollbar-thumb); }
  ::-webkit-scrollbar-thumb:hover { background: var(--oc-scrollbar-thumb-hover); }
  ::-webkit-scrollbar-corner { background: transparent; }
  ::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
}
@media (forced-colors: active) {
  *, :hover, [${GUEST_SCROLLING_ATTRIBUTE}] { scrollbar-color: auto; }
  ::-webkit-scrollbar-thumb, ::-webkit-scrollbar-thumb:hover { background: CanvasText; }
}
`;
function installGuestScrollbarActivity(doc) {
  const root = doc.documentElement;
  if (root.hasAttribute("data-oc-scrollbar-activity"))
    return;
  root.setAttribute("data-oc-scrollbar-activity", "");
  const timers = new WeakMap;
  doc.addEventListener("scroll", (event) => {
    const target = event.target === doc ? root : event.target;
    if (!(target instanceof Element))
      return;
    if (!target.hasAttribute("data-oc-scrolling"))
      target.setAttribute("data-oc-scrolling", "");
    const pending = timers.get(target);
    if (pending !== undefined)
      clearTimeout(pending);
    timers.set(target, setTimeout(() => {
      timers.delete(target);
      target.removeAttribute("data-oc-scrolling");
    }, 1000));
  }, { capture: true, passive: true });
}
var GUEST_SCROLLBAR_SCRIPT = `(${installGuestScrollbarActivity.toString()})(document);`;
// node_modules/@openchamber/sdk/dist/file-editor.js
var patternExpressions = new Map;
// node_modules/@openchamber/sdk/dist/contract.js
var GUEST_FILE_STAT_KINDS = ["file", "directory", "other", "missing"];
var GUEST_GENERATE_LATE_KEEP_MS = 60 * 60000;
var HOST_REQUEST_ERROR_CODES = [
  "HOST_UNAVAILABLE",
  "HOST_TIMEOUT",
  "HOST_REJECTED",
  "DISCONNECTED",
  "DISABLED",
  "BAD_PATH",
  "NO_INTEGRATION",
  "NO_SERVICE",
  "SERVICE_FAILED",
  "REQUEST_FAILED",
  "RESPONSE_TOO_LARGE",
  "NO_SESSION",
  "SESSION_BUSY",
  "NOT_GRANTED",
  "NO_DIRECTORY",
  "NOT_FOUND",
  "FILE_TOO_LARGE",
  "DENIED",
  "NO_MODEL",
  "MODEL_FAILED",
  "UNSUPPORTED"
];
var SERVICE_STATUS_VALUES = ["stopped", "starting", "ready", "failed"];
var hostRequestErrorCodeSet = new Set(HOST_REQUEST_ERROR_CODES);
var serviceStatusSet = new Set(SERVICE_STATUS_VALUES);
var fileStatKindSet = new Set(GUEST_FILE_STAT_KINDS);
var HOST_PUSH_TYPES = new Set([
  "workspace",
  "shells",
  "ready",
  "directory",
  "session",
  "connection",
  "settings",
  "session-lifecycle",
  "item",
  "resolve",
  "action",
  "status-control-event",
  "popover-closed",
  "file-open",
  "file-snapshot",
  "file-saved",
  "generate-late"
]);
// node_modules/@openchamber/sdk/dist/service-providers.js
var BROWSER_PROVIDER_PATH = "/browser-control";
var BROWSER_CONTROL_ACTIONS = [
  "browser.open",
  "browser.snapshot",
  "browser.click",
  "browser.type",
  "browser.scroll",
  "browser.back",
  "browser.forward",
  "browser.inspect",
  "browser.capture",
  "browser.resize",
  "browser.close"
];
var BROWSER_PROVIDER_IDLE_MS = 10 * 60000;
var CONTROL_ACTIONS = new Set(BROWSER_CONTROL_ACTIONS);
var isBrowserControlAction = (value) => CONTROL_ACTIONS.has(value);
var readContext = (wire) => {
  const directory = wire?.directory;
  const sessionId = wire?.sessionId;
  return {
    directory: String(directory) === directory && directory.length > 0 ? directory : null,
    sessionId: String(sessionId) === sessionId && sessionId.length > 0 ? sessionId : null
  };
};
var readBrowserProviderRequest = (body) => {
  let wire;
  try {
    const parsed = JSON.parse(body);
    if (Object(parsed) !== parsed || parsed === null)
      return null;
    wire = parsed;
  } catch {
    return null;
  }
  const { requestId, action, parameters, context } = wire;
  if (String(requestId) !== requestId || requestId.length === 0)
    return null;
  if (String(action) !== action || !isBrowserControlAction(action))
    return null;
  if (Object(parameters) !== parameters)
    return null;
  return { requestId, action, parameters, context: readContext(context) };
};
// node_modules/@openchamber/sdk/dist/service-surface.js
var SURFACE_FRAME_PATH = "/surface/frame";
var SURFACE_INPUT_PATH = "/surface/input";
var SURFACE_CONTROL_PATH = "/surface/control";
var SURFACE_RESIZE_PATH = "/surface/resize";
var SURFACE_CLIPBOARD_PATH = "/surface/clipboard";
var SURFACE_SEQ_HEADER = "x-surface-seq";
var SURFACE_WIDTH_HEADER = "x-surface-width";
var SURFACE_HEIGHT_HEADER = "x-surface-height";
var SURFACE_TITLE_HEADER = "x-surface-title";
var SURFACE_AGENT_ACTIVE_HEADER = "x-surface-agent-active";
var SURFACE_VIEWER_HEADER = "x-surface-viewer";
var SURFACE_FRAME_SEQ_HEADER = "x-surface-frame-seq";
var SURFACE_INPUT_BATCH_MAX = 256;
var SURFACE_TEXT_MAX = 64000;
var SURFACE_TITLE_MAX = 200;
var SURFACE_DIMENSION_MAX = 16384;
var SURFACE_CONTROLLERS = ["none", "agent", "user"];
var isFiniteNumber = (value) => Number(value) === value && Number.isFinite(value);
var isBool = (value) => value === true || value === false;
var isText = (value) => String(value) === value;
var readModifiers = (value) => {
  if (Object(value) !== value || value === null)
    return null;
  const wire = value;
  if (!isBool(wire.alt) || !isBool(wire.ctrl) || !isBool(wire.meta) || !isBool(wire.shift))
    return null;
  return { alt: wire.alt, ctrl: wire.ctrl, meta: wire.meta, shift: wire.shift };
};
var readEvent = (value) => {
  if (value.type === "text") {
    if (!isText(value.text) || value.text.length > SURFACE_TEXT_MAX)
      return null;
    return { type: "text", text: value.text };
  }
  const modifiers = readModifiers(value.modifiers);
  if (!modifiers)
    return null;
  if (value.type === "pointer") {
    if (value.action !== "down" && value.action !== "up" && value.action !== "move")
      return null;
    if (!isFiniteNumber(value.x) || !isFiniteNumber(value.y) || !isFiniteNumber(value.button) || !isFiniteNumber(value.buttons))
      return null;
    return { type: "pointer", action: value.action, x: value.x, y: value.y, button: value.button, buttons: value.buttons, modifiers };
  }
  if (value.type === "wheel") {
    if (!isFiniteNumber(value.x) || !isFiniteNumber(value.y) || !isFiniteNumber(value.deltaX) || !isFiniteNumber(value.deltaY))
      return null;
    return { type: "wheel", x: value.x, y: value.y, deltaX: value.deltaX, deltaY: value.deltaY, modifiers };
  }
  if (value.type === "key") {
    if (value.action !== "down" && value.action !== "up")
      return null;
    if (!isText(value.key) || !isText(value.code) || value.key.length > 64 || value.code.length > 64)
      return null;
    return { type: "key", action: value.action, key: value.key, code: value.code, modifiers };
  }
  return null;
};
var readSurfaceInputBatch = (body) => {
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  if (Object(parsed) !== parsed || parsed === null || !Array.isArray(parsed.events))
    return null;
  if (parsed.events.length > SURFACE_INPUT_BATCH_MAX)
    return null;
  const events = [];
  for (const item of parsed.events) {
    if (Object(item) !== item || item === null)
      return null;
    const event = readEvent(item);
    if (!event)
      return null;
    events.push(event);
  }
  return { events };
};
var CONTROLLERS = new Set(SURFACE_CONTROLLERS);
var readSurfaceControlNotice = (body) => {
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  if (Object(parsed) !== parsed || parsed === null)
    return null;
  const { controller, viewer } = parsed;
  if (!isText(controller) || !CONTROLLERS.has(controller))
    return null;
  const notice = { controller };
  if (controller === "user" && isText(viewer) && viewer.length > 0)
    notice.viewer = viewer;
  return notice;
};
var readSurfaceResizeRequest = (body) => {
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }
  if (Object(parsed) !== parsed || parsed === null)
    return null;
  const { width, height } = parsed;
  if (!isFiniteNumber(width) || !isFiniteNumber(height))
    return null;
  if (width < 1 || height < 1 || width > SURFACE_DIMENSION_MAX || height > SURFACE_DIMENSION_MAX)
    return null;
  return { width: Math.round(width), height: Math.round(height) };
};
// service/page-scripts.ts
var MAX_TEXT_CHARS = 6000;
var MAX_ELEMENTS = 120;
var MAX_LABEL_CHARS = 80;
var SCROLL_SETTLE_MAX_MS = 100;
var HELPERS = `
  var MAX_ELEMENTS = ${MAX_ELEMENTS};
  var MAX_LABEL_CHARS = ${MAX_LABEL_CHARS};
  var visible = function (element) {
    var rect = element.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return false;
    var style = window.getComputedStyle(element);
    return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) !== 0;
  };
  var label = function (element) {
    var aria = element.getAttribute('aria-label');
    if (aria) return aria.trim();
    var value = element.getAttribute('value');
    var text = (element.innerText || element.textContent || '').replace(/\\s+/g, ' ').trim();
    if (text) return text.slice(0, MAX_LABEL_CHARS);
    if (value) return String(value).slice(0, MAX_LABEL_CHARS);
    var placeholder = element.getAttribute('placeholder');
    return placeholder ? placeholder.trim().slice(0, MAX_LABEL_CHARS) : '';
  };
  var isUnique = function (selector) {
    try {
      return document.querySelectorAll(selector).length === 1;
    } catch (error) {
      return false;
    }
  };

  /**
   * Names an element by what it is, falling back to where it sits.
   *
   * A positional chain like 'main > section:nth-of-type(3) > div > a' survives
   * only until the markup shifts, and says nothing about what it points at.
   * Anything the page states about identity — an id, a test id, an accessible
   * name — outlives edits and reads as the thing it selects. The chain remains
   * as the last resort, because something always has to work.
   */
  var cssPath = function (element) {
    var tag = element.tagName.toLowerCase();

    if (element.id) {
      var byId = '#' + CSS.escape(element.id);
      if (isUnique(byId)) return byId;
    }
    var stableAttrs = ['data-testid', 'data-test-id', 'data-test', 'name', 'aria-label'];
    for (var a = 0; a < stableAttrs.length; a += 1) {
      var value = element.getAttribute(stableAttrs[a]);
      if (!value) continue;
      var raw = String(value);
      // A value containing a quote would need escaping for no real gain: such
      // attributes are rare, and the positional chain still covers them.
      if (raw.indexOf('"') !== -1) continue;
      var byAttr = tag + '[' + stableAttrs[a] + '="' + raw + '"]';
      if (isUnique(byAttr)) return byAttr;
    }
    var className = typeof element.className === 'string' ? element.className.trim() : '';
    if (className) {
      var classes = className.split(/\\s+/).filter(Boolean);
      for (var c = 0; c < classes.length; c += 1) {
        var byClass = tag + '.' + CSS.escape(classes[c]);
        if (isUnique(byClass)) return byClass;
      }
    }

    var parts = [];
    var node = element;
    var depth = 0;
    while (node && node.nodeType === 1 && depth < 6) {
      var part = node.tagName.toLowerCase();
      var parent = node.parentElement;
      if (!parent) { parts.unshift(part); break; }
      var siblings = Array.prototype.filter.call(parent.children, function (child) {
        return child.tagName === node.tagName;
      });
      if (siblings.length > 1) part += ':nth-of-type(' + (siblings.indexOf(node) + 1) + ')';
      parts.unshift(part);
      if (node.id) { parts[0] = '#' + CSS.escape(node.id); break; }
      node = parent;
      depth += 1;
    }
    return parts.join(' > ');
  };

  /** What a screen reader would announce, or '' when there is nothing to say. */
  var accessibleName = function (element) {
    var aria = element.getAttribute('aria-label');
    if (aria && aria.trim()) return aria.trim();
    var labelled = element.getAttribute('aria-labelledby');
    if (labelled) {
      var source = document.getElementById(labelled.split(/\\s+/)[0]);
      if (source && (source.innerText || '').trim()) return source.innerText.trim();
    }
    var title = element.getAttribute('title');
    if (title && title.trim()) return title.trim();
    var alt = element.getAttribute('alt');
    if (alt && alt.trim()) return alt.trim();
    var text = (element.innerText || element.textContent || '').replace(/\\s+/g, ' ').trim();
    if (text) return text;
    var value = element.getAttribute('value');
    return value && String(value).trim() ? String(value).trim() : '';
  };
  var findByText = function (needle) {
    var wanted = String(needle).replace(/\\s+/g, ' ').trim().toLowerCase();
    var candidates = document.querySelectorAll('a, button, [role="button"], [role="link"], input[type="submit"], input[type="button"], summary, label');
    var exact = null;
    var partial = null;
    for (var i = 0; i < candidates.length; i += 1) {
      var element = candidates[i];
      if (!visible(element)) continue;
      var text = label(element).toLowerCase();
      if (!text) continue;
      if (text === wanted) { exact = element; break; }
      if (!partial && text.indexOf(wanted) !== -1) partial = element;
    }
    return exact || partial;
  };
`;
var wrap = (body) => `(() => {
${HELPERS}
${body}
})()`;
var buildSnapshotScript = ({ selector } = {}) => wrap(`
  var scopeSelector = ${JSON.stringify(selector ?? "")};
  var root = document;
  if (scopeSelector) {
    try { root = document.querySelector(scopeSelector); }
    catch (error) { return { ok: false, error: 'Invalid selector: ' + scopeSelector }; }
    if (!root) return { ok: false, error: 'No element matches ' + scopeSelector };
  }
  var interactive = root.querySelectorAll('a[href], button, input, select, textarea, [role="button"], [role="link"], [role="tab"], [contenteditable="true"]');
  var elements = [];
  var visibleTotal = 0;
  for (var i = 0; i < interactive.length; i += 1) {
    var element = interactive[i];
    if (!visible(element)) continue;
    visibleTotal += 1;
    if (elements.length >= MAX_ELEMENTS) continue;

    var rect = element.getBoundingClientRect();
    // Empty and default-valued fields are left out rather than serialized as
    // "" and false. Repeated across a hundred entries that overhead dwarfed
    // the information it carried.
    var entry = {
      selector: cssPath(element),
      tag: element.tagName.toLowerCase(),
      bounds: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }
    };
    // The list covers the whole document so anything can be clicked without
    // scrolling to it first, which means bounds alone do not say what is on
    // screen — a negative y reads as a bug otherwise.
    if (rect.bottom > 0 && rect.top < window.innerHeight) entry.inViewport = true;
    var type = element.getAttribute('type');
    if (type) entry.type = type;
    var role = element.getAttribute('role');
    if (role) entry.role = role;
    var labelText = label(element);
    if (labelText) entry.label = labelText;
    if (element.disabled === true) entry.disabled = true;
    // Flagged rather than described: reporting the accessible name of every
    // element would cost more than it tells, while its absence on something
    // clickable is a defect worth naming.
    if (!accessibleName(element)) entry.missingAccessibleName = true;
    elements.push(entry);
  }
  var body = document.body ? (document.body.innerText || '') : '';
  var text = body.replace(/\\n{3,}/g, '\\n\\n').trim();
  var docEl = document.documentElement;
  var result = {
    ok: true,
    url: String(location.href),
    title: String(document.title || ''),
    scope: scopeSelector || 'document',
    scrollY: Math.round(window.scrollY),
    maxScrollY: Math.max(0, Math.round(docEl.scrollHeight - window.innerHeight)),
    text: text.slice(0, ${MAX_TEXT_CHARS}),
    elements: elements
  };
  // State what was dropped. A capped list that reports only its own length
  // reads as the whole page, and the agent acts as if it had seen everything.
  if (text.length > ${MAX_TEXT_CHARS}) {
    result.textTruncated = true;
    result.textTotalChars = text.length;
  }
  if (visibleTotal > elements.length) {
    result.elementsTruncated = true;
    result.interactiveElementsOnPage = visibleTotal;
  }
  return result;
`);
var buildClickScript = ({ selector, text }) => wrap(`
  var selector = ${JSON.stringify(selector ?? "")};
  var text = ${JSON.stringify(text ?? "")};
  var target = null;
  if (selector) {
    try { target = document.querySelector(selector); }
    catch (error) { return { ok: false, error: 'Invalid selector: ' + selector }; }
    if (!target) return { ok: false, error: 'No element matches ' + selector };
  } else {
    target = findByText(text);
    if (!target) return { ok: false, error: 'No clickable element has the label ' + text };
  }
  if (target.disabled === true) return { ok: false, error: 'Element is disabled' };
  target.scrollIntoView({ block: 'center', inline: 'center' });

  // A real click is a sequence, and many widgets act on its first half:
  // custom selects open on mousedown or focus and ignore the click itself.
  // Replay what the mouse would send to the middle of the element. The event
  // goes to whatever is drawn there when that sits inside the target, as it
  // would under a real pointer; anything else keeps the target the agent named.
  var rect = target.getBoundingClientRect();
  var x = rect.left + rect.width / 2;
  var y = rect.top + rect.height / 2;
  var drawn = document.elementFromPoint(x, y);
  var hit = drawn && target.contains(drawn) ? drawn : target;
  var fire = function (element, Type, type, extra) {
    var init = {
      bubbles: true, cancelable: true, composed: true, view: window,
      clientX: x, clientY: y, button: 0, buttons: 0, detail: 1,
      pointerId: 1, pointerType: 'mouse', isPrimary: true
    };
    for (var key in extra) init[key] = extra[key];
    return element.dispatchEvent(new Type(type, init));
  };
  var Pointer = window.PointerEvent || window.MouseEvent;
  var Mouse = window.MouseEvent;
  var notBubbling = { bubbles: false, cancelable: false };

  fire(hit, Pointer, 'pointerover', {});
  fire(hit, Pointer, 'pointerenter', notBubbling);
  fire(hit, Mouse, 'mouseover', {});
  fire(hit, Mouse, 'mouseenter', notBubbling);
  var pointerDown = fire(hit, Pointer, 'pointerdown', { buttons: 1 });
  // A cancelled pointerdown suppresses the mouse events, as in a browser.
  var mouseDown = pointerDown ? fire(hit, Mouse, 'mousedown', { buttons: 1 }) : true;
  // Focus moves on mousedown unless the page prevented it, to the nearest
  // focusable element under the pointer; with none, the old focus is lost.
  if (mouseDown) {
    var focusable = hit.closest('a[href], button, input, select, textarea, summary, [tabindex], [contenteditable]:not([contenteditable="false"])');
    if (focusable && focusable.disabled !== true) focusable.focus({ preventScroll: true });
    else if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  }
  // The mousedown may have redrawn the widget; the release lands on what is
  // under the pointer now, and the click on what both halves share.
  var redrawn = document.elementFromPoint(x, y);
  var up = redrawn && target.contains(redrawn) ? redrawn : (target.isConnected ? target : hit);
  fire(up, Pointer, 'pointerup', {});
  if (pointerDown) fire(up, Mouse, 'mouseup', {});
  var clicked = up;
  if (hit.isConnected) {
    while (clicked && !clicked.contains(hit)) clicked = clicked.parentElement;
  }
  fire(clicked || up, Mouse, 'click', {});
  return { ok: true, clicked: cssPath(target), label: label(target), url: String(location.href) };
`);
var buildTypeScript = ({ selector, value, submit }) => wrap(`
  var selector = ${JSON.stringify(selector)};
  var value = ${JSON.stringify(value)};
  var target = null;
  try { target = document.querySelector(selector); }
  catch (error) { return { ok: false, error: 'Invalid selector: ' + selector }; }
  if (!target) return { ok: false, error: 'No element matches ' + selector };

  var editable = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
  if (!editable) return { ok: false, error: selector + ' is not a text field' };
  if (target.disabled === true || target.readOnly === true) return { ok: false, error: 'Field is not editable' };

  target.scrollIntoView({ block: 'center' });
  target.focus();
  if (target.isContentEditable) {
    target.textContent = value;
  } else {
    // Frameworks track the value through the native setter; assigning the
    // property directly leaves React and friends unaware of the change.
    var prototype = target.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    var setter = Object.getOwnPropertyDescriptor(prototype, 'value');
    if (setter && setter.set) setter.set.call(target, value);
    else target.value = value;
  }
  target.dispatchEvent(new Event('input', { bubbles: true }));
  target.dispatchEvent(new Event('change', { bubbles: true }));

  if (${submit ? "true" : "false"}) {
    var enter = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true };
    target.dispatchEvent(new KeyboardEvent('keydown', enter));
    target.dispatchEvent(new KeyboardEvent('keyup', enter));
    var form = target.form;
    if (form && typeof form.requestSubmit === 'function') form.requestSubmit();
  }
  return { ok: true, selector: cssPath(target), url: String(location.href) };
`);
var buildScrollScript = ({ selector, direction }) => wrap(`
  var selector = ${JSON.stringify(selector ?? "")};
  var direction = ${JSON.stringify(direction ?? "")};

  // Two frames let the layout catch up, but a page in a hidden background tab
  // is not composited and gets no frames at all while still reporting itself
  // visible, so the wait is capped by a timer. The scroll
  // itself is instant, so the position read then is already the final one.
  var settle = function (extra) {
    return new Promise(function (resolve) {
      var done = false;
      var finish = function () {
        if (done) return;
        done = true;
        var doc = document.documentElement;
        var maxScrollY = Math.max(0, doc.scrollHeight - window.innerHeight);
        var scrollY = Math.round(window.scrollY);
        var result = { ok: true, scrollY: scrollY, maxScrollY: Math.round(maxScrollY) };
        result.atTop = scrollY <= 1;
        result.atBottom = scrollY >= maxScrollY - 1;
        for (var key in extra) {
          if (Object.prototype.hasOwnProperty.call(extra, key)) result[key] = extra[key];
        }
        resolve(result);
      };
      requestAnimationFrame(function () {
        requestAnimationFrame(finish);
      });
      setTimeout(finish, ${SCROLL_SETTLE_MAX_MS});
    });
  };

  if (selector) {
    var target = null;
    try { target = document.querySelector(selector); }
    catch (error) { return { ok: false, error: 'Invalid selector: ' + selector }; }
    if (!target) return { ok: false, error: 'No element matches ' + selector };
    // Instant on purpose: the page's own smooth scrolling would still be
    // animating when the next action runs against it.
    target.scrollIntoView({ block: 'center', behavior: 'instant' });
    return settle({ scrolledTo: cssPath(target) });
  }

  var doc = document.documentElement;
  var page = Math.round(window.innerHeight * 0.85);
  var bottom = Math.max(0, doc.scrollHeight - window.innerHeight);
  if (direction === 'down') window.scrollTo({ top: window.scrollY + page, behavior: 'instant' });
  else if (direction === 'up') window.scrollTo({ top: window.scrollY - page, behavior: 'instant' });
  else if (direction === 'top') window.scrollTo({ top: 0, behavior: 'instant' });
  else if (direction === 'bottom') window.scrollTo({ top: bottom, behavior: 'instant' });
  else return { ok: false, error: 'Unknown scroll direction: ' + direction };
  return settle({ direction: direction });
`);
var INSPECTED_STYLE_PROPS = [
  "color",
  "background-color",
  "background-image",
  "opacity",
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "text-align",
  "border-radius",
  "border-width",
  "border-style",
  "border-color",
  "box-shadow",
  "display",
  "position",
  "width",
  "height",
  "padding",
  "margin",
  "gap",
  "flex-direction",
  "justify-content",
  "align-items",
  "z-index",
  "overflow",
  "visibility"
];
var buildInspectScript = ({ selector }) => wrap(`
  var selector = ${JSON.stringify(selector)};
  var target = null;
  try { target = document.querySelector(selector); }
  catch (error) { return { ok: false, error: 'Invalid selector: ' + selector }; }
  if (!target) return { ok: false, error: 'No element matches ' + selector };

  var computed = window.getComputedStyle(target);
  var styles = {};
  var props = ${JSON.stringify(INSPECTED_STYLE_PROPS)};
  for (var i = 0; i < props.length; i += 1) {
    var value = computed.getPropertyValue(props[i]);
    if (value) styles[props[i]] = String(value).trim();
  }

  var rect = target.getBoundingClientRect();
  return {
    ok: true,
    selector: cssPath(target),
    tag: target.tagName.toLowerCase(),
    label: label(target),
    bounds: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
    inViewport: rect.bottom > 0 && rect.top < window.innerHeight,
    styles: styles
  };
`);
var buildLocateScript = ({ selector, text }) => wrap(`
  var selector = ${JSON.stringify(selector ?? "")};
  var text = ${JSON.stringify(text ?? "")};
  var target = null;
  if (selector) {
    try { target = document.querySelector(selector); }
    catch (error) { return { ok: false, error: 'Invalid selector: ' + selector }; }
    if (!target) return { ok: false, error: 'No element matches ' + selector };
  } else {
    target = findByText(text);
    if (!target) return { ok: false, error: 'No clickable element has the label ' + text };
  }
  if (target.disabled === true) return { ok: false, error: 'Element is disabled' };
  target.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
  var rect = target.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return { ok: false, error: 'Element is not visible: ' + cssPath(target) };
  var x = rect.left + rect.width / 2;
  var y = rect.top + rect.height / 2;
  var drawn = document.elementFromPoint(x, y);
  var covered = !(drawn && (drawn === target || target.contains(drawn) || drawn.contains(target) && drawn.tagName === 'LABEL'));
  return {
    ok: true,
    x: x,
    y: y,
    covered: covered,
    selector: cssPath(target),
    label: label(target),
    url: String(location.href)
  };
`);
var buildFocusFieldScript = ({ selector }) => wrap(`
  var selector = ${JSON.stringify(selector)};
  var target = null;
  try { target = document.querySelector(selector); }
  catch (error) { return { ok: false, error: 'Invalid selector: ' + selector }; }
  if (!target) return { ok: false, error: 'No element matches ' + selector };
  var editable = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
  if (!editable) return { ok: false, error: selector + ' is not a text field' };
  if (target.disabled === true || target.readOnly === true) return { ok: false, error: 'Field is not editable' };
  target.scrollIntoView({ block: 'center', behavior: 'instant' });
  target.focus();
  if (target.isContentEditable) {
    var range = document.createRange();
    range.selectNodeContents(target);
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  } else if (typeof target.select === 'function') {
    target.select();
  }
  return {
    ok: true,
    focused: document.activeElement === target,
    selector: cssPath(target),
    url: String(location.href)
  };
`);
var buildReadFieldScript = ({ selector }) => `(() => {
  var target = null;
  try { target = document.querySelector(${JSON.stringify(selector)}); } catch (error) { return null; }
  if (!target) return null;
  return target.isContentEditable ? String(target.textContent || '') : String(target.value || '');
})()`;
var SELECTION_SCRIPT = `(() => {
  var active = document.activeElement;
  if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA') && typeof active.selectionStart === 'number') {
    return String(active.value || '').slice(active.selectionStart, active.selectionEnd);
  }
  return String(window.getSelection() || '');
})()`;

// service/actions.ts
var fail = (error) => ({ ok: false, error });
var withoutOk = (answer) => {
  const { ok: _ok, ...rest } = answer;
  return rest;
};
var NO_TAB = "No page is open yet. Use browser.open with a URL first.";
var resolveTab = (browser, tabId) => {
  if (tabId !== undefined) {
    const tab = browser.tabs.get(tabId);
    return tab ?? `There is no tab ${tabId}. Use an id from the tabs list in browser.snapshot, or omit tabId for the page on screen.`;
  }
  return browser.shownTab ?? NO_TAB;
};
var follow = (browser, tab) => {
  if (browser.controller !== "user" && browser.shownTabId !== tab.id)
    browser.show(tab.id);
};
var runScript = async (browser, tab, script) => {
  const answer = await browser.evaluate(tab, script);
  return answer ?? { ok: false, error: "The page did not answer; it may still be loading. Try again." };
};
var handleAction = async (browser, request) => {
  await browser.ensure();
  browser.markAgentActive();
  const caller = request.context.sessionId;
  if (request.action === "browser.open") {
    const { url, viewport, tabId } = request.parameters;
    if (tabId !== undefined) {
      const tab = browser.tabs.get(tabId);
      if (!tab)
        return fail(`There is no tab ${tabId}. Omit tabId to open the page in a new tab.`);
      if (viewport && viewport !== tab.viewportMode)
        await browser.setViewport(tab, viewport);
      follow(browser, tab);
      const { settled } = await browser.navigate(tab, url, 30000);
      const page = await browser.pageUrlAndTitle(tab);
      return { ok: true, data: { tabId: tab.id, ...page, opened: true, settled, viewport: browser.viewportSummary(tab) } };
    }
    const tab = await browser.createTab("about:blank", caller, viewport ?? browser.config.defaultViewport);
    follow(browser, tab);
    try {
      const { settled } = await browser.navigate(tab, url, 30000);
      const page = await browser.pageUrlAndTitle(tab);
      return { ok: true, data: { tabId: tab.id, ...page, opened: true, settled, viewport: browser.viewportSummary(tab) } };
    } catch (error) {
      await browser.closeTab(tab);
      throw error;
    }
  }
  const resolved = resolveTab(browser, request.parameters.tabId);
  if (typeof resolved === "string") {
    if (request.action !== "browser.close")
      return fail(resolved);
  }
  const target = typeof resolved === "string" ? undefined : resolved;
  if (target)
    target.lastUsed = Date.now();
  switch (request.action) {
    case "browser.snapshot": {
      const tab = target;
      const answer = await runScript(browser, tab, buildSnapshotScript({ selector: request.parameters.selector }));
      if (!answer.ok)
        return fail(answer.error);
      const data = withoutOk(answer);
      if (data.url.startsWith("data:")) {
        data.url = "about:blank";
        data.title = "Server Browser";
      }
      data.viewport = browser.viewportSummary(tab);
      if (tab.console.length > 0)
        data.consoleProblems = tab.console.slice(-15);
      data.tabs = browser.listTabs();
      return { ok: true, data };
    }
    case "browser.click": {
      const tab = target;
      follow(browser, tab);
      const { selector, text } = request.parameters;
      const located = await runScript(browser, tab, buildLocateScript({ selector, text }));
      if (!located.ok)
        return fail(located.error);
      if (located.covered) {
        const clicked = await browser.withNavigation(tab, () => runScript(browser, tab, buildClickScript({ selector, text })));
        if (!clicked.ok)
          return fail(clicked.error);
      } else {
        await browser.withNavigation(tab, () => browser.mouseClick(tab, Number(located.x), Number(located.y)));
      }
      const { url } = await browser.pageUrlAndTitle(tab);
      return { ok: true, data: { clicked: String(located.selector), label: String(located.label ?? ""), url } };
    }
    case "browser.type": {
      const tab = target;
      follow(browser, tab);
      const { selector, value, submit } = request.parameters;
      const focused = await runScript(browser, tab, buildFocusFieldScript({ selector }));
      if (!focused.ok)
        return fail(focused.error);
      if (value === "")
        await browser.deleteSelection(tab);
      else
        await browser.insertText(tab, value);
      const now = await browser.evaluate(tab, buildReadFieldScript({ selector })).catch(() => null);
      if (now !== null && now !== value) {
        const set = await runScript(browser, tab, buildTypeScript({ selector, value, submit: false }));
        if (!set.ok)
          return fail(set.error);
      }
      if (submit)
        await browser.withNavigation(tab, () => browser.pressEnter(tab));
      const { url } = await browser.pageUrlAndTitle(tab);
      return { ok: true, data: { selector: String(focused.selector), url } };
    }
    case "browser.scroll": {
      const tab = target;
      follow(browser, tab);
      const answer = await runScript(browser, tab, buildScrollScript(request.parameters));
      if (!answer.ok)
        return fail(answer.error);
      return { ok: true, data: withoutOk(answer) };
    }
    case "browser.back":
    case "browser.forward": {
      const tab = target;
      follow(browser, tab);
      const history = await browser.evaluateHistory(tab);
      const index = history.currentIndex + (request.action === "browser.back" ? -1 : 1);
      const entry = history.entries[index];
      if (!entry)
        return fail(`There is nothing to go ${request.action === "browser.back" ? "back" : "forward"} to in this tab`);
      await browser.withNavigation(tab, () => browser.goToHistoryEntry(tab, entry.id));
      return { ok: true, data: await browser.pageUrlAndTitle(tab) };
    }
    case "browser.inspect": {
      const tab = target;
      const answer = await runScript(browser, tab, buildInspectScript({ selector: request.parameters.selector }));
      if (!answer.ok)
        return fail(answer.error);
      return { ok: true, data: withoutOk(answer) };
    }
    case "browser.capture": {
      const tab = target;
      const bytes = await browser.screenshot(tab, "png");
      const page = await browser.pageUrlAndTitle(tab);
      return {
        ok: true,
        data: {
          base64: bytes.toString("base64"),
          mime: "image/png",
          width: tab.width,
          height: tab.height,
          ...page,
          viewport: browser.viewportSummary(tab)
        }
      };
    }
    case "browser.resize": {
      const tab = target;
      follow(browser, tab);
      await browser.setViewport(tab, request.parameters.viewport);
      return { ok: true, data: { viewport: browser.viewportSummary(tab) } };
    }
    case "browser.close": {
      if (!caller)
        return fail("Only a tab an agent chat opened can be closed, and this call came from no chat.");
      let tab;
      if (request.parameters.tabId !== undefined) {
        tab = browser.tabs.get(request.parameters.tabId);
        if (!tab)
          return fail(`There is no tab ${request.parameters.tabId}.`);
        if (tab.openedBy !== caller)
          return fail(`Tab ${tab.id} was not opened by this chat; it is left open.`);
      } else {
        tab = [...browser.tabs.values()].filter((candidate) => candidate.openedBy === caller).sort((a, b) => b.lastUsed - a.lastUsed)[0];
        if (!tab)
          return fail("This chat has no open tab to close.");
      }
      await browser.closeTab(tab);
      return { ok: true, data: { closed: true, tabId: tab.id } };
    }
    default:
      return fail("Unknown action");
  }
};

// service/browser.ts
import { spawn } from "node:child_process";
import { mkdirSync, readlinkSync } from "node:fs";
import os2 from "node:os";
import path2 from "node:path";

// service/cdp.ts
import { EventEmitter } from "node:events";

class CdpError extends Error {
  method;
  constructor(method, message) {
    super(`${method}: ${message}`);
    this.method = method;
  }
}

class CdpConnection extends EventEmitter {
  out;
  nextId = 1;
  pending = new Map;
  buffer = [];
  closed = false;
  constructor(out, input) {
    super();
    this.out = out;
    input.on("data", (chunk) => this.onData(chunk));
    input.on("close", () => this.onClose());
    input.on("error", () => this.onClose());
    out.on("error", () => this.onClose());
  }
  get isClosed() {
    return this.closed;
  }
  send(method, params = {}, sessionId) {
    if (this.closed)
      return Promise.reject(new CdpError(method, "browser connection is closed"));
    const id = this.nextId;
    this.nextId += 1;
    const message = { id, method, params };
    if (sessionId)
      message.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.out.write(`${JSON.stringify(message)}\x00`);
    });
  }
  onData(chunk) {
    let start = 0;
    let end = chunk.indexOf(0, start);
    while (end !== -1) {
      this.buffer.push(chunk.subarray(start, end));
      const raw = Buffer.concat(this.buffer).toString("utf8");
      this.buffer = [];
      this.dispatch(raw);
      start = end + 1;
      end = chunk.indexOf(0, start);
    }
    if (start < chunk.length)
      this.buffer.push(chunk.subarray(start));
  }
  dispatch(raw) {
    let message;
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }
    if (typeof message.id === "number") {
      const waiter = this.pending.get(message.id);
      if (!waiter)
        return;
      this.pending.delete(message.id);
      if (message.error)
        waiter.reject(new CdpError(waiter.method, message.error.message ?? "unknown error"));
      else
        waiter.resolve(message.result ?? {});
      return;
    }
    if (typeof message.method === "string") {
      this.emit("event", message.method, message.params ?? {}, message.sessionId);
    }
  }
  onClose() {
    if (this.closed)
      return;
    this.closed = true;
    for (const waiter of this.pending.values())
      waiter.reject(new CdpError(waiter.method, "browser connection closed"));
    this.pending.clear();
    this.emit("close");
  }
}

// service/config.ts
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
var VIEWPORT_MODES = new Set(["mobile", "tablet", "desktop", "fill"]);
var packageRoot = () => path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
var userConfigPath = () => path.join(os.homedir(), ".config", "openchamber-server-browser", "config.json");
var readJson = (file) => {
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};
var expandHome = (value) => value.startsWith("~/") ? path.join(os.homedir(), value.slice(2)) : value;
var loadConfig = () => {
  const merged = { ...readJson(path.join(packageRoot(), "config.json")), ...readJson(userConfigPath()) };
  const config = {
    extraArgs: [],
    profileDir: path.join(os.homedir(), ".local", "share", "openchamber-server-browser", "profile"),
    defaultViewport: "desktop",
    ignoreHttpsErrors: false,
    maxTabs: 10,
    screencastQuality: 70
  };
  if (typeof merged.chromePath === "string" && merged.chromePath)
    config.chromePath = expandHome(merged.chromePath);
  if (Array.isArray(merged.extraArgs))
    config.extraArgs = merged.extraArgs.filter((arg) => typeof arg === "string");
  if (typeof merged.profileDir === "string" && merged.profileDir)
    config.profileDir = expandHome(merged.profileDir);
  if (typeof merged.defaultViewport === "string" && VIEWPORT_MODES.has(merged.defaultViewport)) {
    config.defaultViewport = merged.defaultViewport;
  }
  if (typeof merged.ignoreHttpsErrors === "boolean")
    config.ignoreHttpsErrors = merged.ignoreHttpsErrors;
  if (typeof merged.maxTabs === "number" && merged.maxTabs >= 1)
    config.maxTabs = Math.floor(merged.maxTabs);
  if (typeof merged.screencastQuality === "number")
    config.screencastQuality = Math.max(30, Math.min(95, Math.round(merged.screencastQuality)));
  return config;
};
var isExecutable = (file) => {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
};
var playwrightBrowsers = () => {
  const roots = [
    path.join(os.homedir(), ".cache", "ms-playwright"),
    path.join(os.homedir(), "Library", "Caches", "ms-playwright")
  ];
  const found = [];
  for (const root of roots) {
    if (!existsSync(root))
      continue;
    const dirs = readdirSync(root).filter((name) => name.startsWith("chromium")).sort((a, b) => {
      const rev = (name) => Number(name.split("-").pop()) || 0;
      return rev(b) - rev(a);
    });
    for (const dir of dirs) {
      const base = path.join(root, dir);
      for (const candidate of [
        "chrome-linux64/chrome",
        "chrome-linux/chrome",
        "chrome-headless-shell-linux64/chrome-headless-shell",
        "chrome-linux/headless_shell",
        "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
        "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
      ]) {
        found.push(path.join(base, candidate));
      }
    }
  }
  return found;
};
var onPath = (names) => {
  const dirs = (process.env.PATH ?? "").split(path.delimiter).filter(Boolean);
  return names.flatMap((name) => dirs.map((dir) => path.join(dir, name)));
};
var findChrome = (config) => {
  if (config.chromePath) {
    return isExecutable(config.chromePath) ? { path: config.chromePath } : { error: `chromePath ${config.chromePath} from the config file does not exist.` };
  }
  const candidates = [
    ...playwrightBrowsers(),
    ...onPath(["google-chrome-stable", "google-chrome", "chromium", "chromium-browser", "chrome"]),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/snap/bin/chromium"
  ];
  const hit = candidates.find(isExecutable);
  if (hit)
    return { path: hit };
  return {
    error: "No Chrome or Chromium found on the OpenChamber host. Install one (e.g. `npx playwright install chromium` " + `as the user running OpenChamber) or set "chromePath" in ${userConfigPath()}.`
  };
};

// service/browser.ts
var VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 820, height: 1180 },
  desktop: { width: 1280, height: 800 }
};
var FILL_FALLBACK = { width: 1280, height: 800 };
var CONSOLE_KEEP = 30;
var START_PAGE = `data:text/html;charset=utf-8,${encodeURIComponent(`<!doctype html><html><head><title>Server Browser</title>
<meta name="color-scheme" content="light dark"><style>
body{font:15px/1.5 system-ui,sans-serif;display:grid;place-items:center;height:100vh;margin:0;color:#555;background:#f6f6f4}
@media (prefers-color-scheme:dark){body{background:#1c1c1c;color:#aaa}}
main{max-width:30em;padding:2em;text-align:center}h1{font-size:18px;font-weight:600;margin:0 0 .5em}
</style></head><body><main><h1>Server Browser is ready</h1>
<p>Pages an agent opens appear here. Type an address above to browse yourself; click the picture to take control.</p>
</main></body></html>`)}`;
var sleep = (ms) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});
var imageSize = (bytes) => {
  if (bytes[0] === 137 && bytes.toString("ascii", 1, 4) === "PNG") {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 255)
      return null;
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if (marker >= 192 && marker <= 207 && marker !== 196 && marker !== 200 && marker !== 204) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    offset += 2 + length;
  }
  return null;
};
var summarizeArgs = (args) => (args ?? []).map((arg) => arg.value !== undefined ? typeof arg.value === "string" ? arg.value : JSON.stringify(arg.value) : arg.description ?? arg.type ?? "").join(" ").slice(0, 500);

class ServerBrowser {
  config = loadConfig();
  proc = null;
  conn = null;
  starting = null;
  stderrTail = [];
  lastError = null;
  tabs = new Map;
  byTarget = new Map;
  bySession = new Map;
  attachWaiters = new Map;
  nextTab = 1;
  creating = 0;
  shownTabId = null;
  frame = null;
  seq = 1;
  tabFirstSeq = 1;
  frameWaiters = [];
  controller = "none";
  controllingViewer = null;
  agentActiveUntil = 0;
  agentActiveTimer = null;
  panelSize = null;
  lastDown = { at: 0, x: 0, y: 0, button: -1, count: 0 };
  get running() {
    return Boolean(this.conn && !this.conn.isClosed);
  }
  async ensure() {
    if (this.running && this.tabs.size > 0)
      return;
    if (!this.starting) {
      this.starting = this.launch().finally(() => {
        this.starting = null;
      });
    }
    await this.starting;
  }
  async launch() {
    this.config = loadConfig();
    const chrome = findChrome(this.config);
    if ("error" in chrome) {
      this.lastError = chrome.error;
      throw new Error(chrome.error);
    }
    mkdirSync(this.config.profileDir, { recursive: true });
    this.clearStaleProfileLock();
    const args = [
      "--headless=new",
      "--remote-debugging-pipe",
      `--user-data-dir=${this.config.profileDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-background-networking",
      "--disable-component-update",
      "--disable-default-apps",
      "--disable-sync",
      "--disable-features=Translate,MediaRouter,OptimizationHints",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      "--mute-audio",
      "--password-store=basic",
      "--use-mock-keychain",
      `--window-size=${VIEWPORTS.desktop.width},${VIEWPORTS.desktop.height}`
    ];
    if (process.getuid?.() === 0)
      args.push("--no-sandbox");
    args.push(...this.config.extraArgs, "about:blank");
    this.stderrTail = [];
    const proc = spawn(chrome.path, args, { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] });
    this.proc = proc;
    proc.stderr?.on("data", (chunk) => {
      for (const line of chunk.toString("utf8").split(`
`)) {
        if (!line.trim())
          continue;
        this.stderrTail.push(line.slice(0, 300));
        if (this.stderrTail.length > 15)
          this.stderrTail.shift();
      }
    });
    const exited = new Promise((resolve) => {
      proc.once("exit", (code) => resolve(code));
      proc.once("error", () => resolve(-1));
    });
    proc.once("exit", () => this.onBrowserGone(proc));
    const conn = new CdpConnection(proc.stdio[3], proc.stdio[4]);
    this.conn = conn;
    conn.on("event", (method, params, sessionId) => this.onEvent(method, params, sessionId));
    try {
      const version = await Promise.race([
        conn.send("Browser.getVersion"),
        exited.then((code) => {
          throw new Error(`Chrome exited (code ${code})`);
        }),
        sleep(30000).then(() => {
          throw new Error("Chrome did not answer within 30 s");
        })
      ]);
      await conn.send("Target.setDiscoverTargets", { discover: true });
      await conn.send("Target.setAutoAttach", { autoAttach: true, waitForDebuggerOnStart: true, flatten: true });
      const { targetInfos } = await conn.send("Target.getTargets");
      for (const info of targetInfos ?? []) {
        if (info.type === "page" && !this.byTarget.has(info.targetId)) {
          await conn.send("Target.attachToTarget", { targetId: info.targetId, flatten: true }).catch(() => {
            return;
          });
        }
      }
      await sleep(100);
      if (this.tabs.size === 0)
        await this.createTab(START_PAGE, null);
      else {
        const first = [...this.tabs.values()][0];
        await first.ready;
        await this.navigate(first, START_PAGE, 5000).catch(() => {
          return;
        });
        this.show(first.id);
      }
      this.lastError = null;
    } catch (error) {
      const detail = this.stderrTail.slice(-4).join(" | ");
      this.lastError = `Could not start Chrome at ${chrome.path}: ${error.message}${detail ? ` — ${detail}` : ""}`;
      this.kill();
      throw new Error(this.lastError);
    }
  }
  clearStaleProfileLock() {
    try {
      const target = readlinkSync(path2.join(this.config.profileDir, "SingletonLock"));
      const [host, pidText] = [target.slice(0, target.lastIndexOf("-")), target.slice(target.lastIndexOf("-") + 1)];
      const pid = Number(pidText);
      if (host === os2.hostname() && pid > 0) {
        try {
          process.kill(pid, "SIGKILL");
        } catch {}
      }
    } catch {}
  }
  onBrowserGone(proc) {
    if (this.proc !== proc)
      return;
    this.proc = null;
    this.conn = null;
    this.tabs.clear();
    this.byTarget.clear();
    this.bySession.clear();
    this.shownTabId = null;
    this.frame = null;
    this.touch();
  }
  kill() {
    const proc = this.proc;
    if (!proc)
      return;
    try {
      proc.kill("SIGKILL");
    } catch {}
    this.onBrowserGone(proc);
  }
  async close() {
    const conn = this.conn;
    const proc = this.proc;
    if (!conn || !proc)
      return;
    await Promise.race([conn.send("Browser.close").catch(() => {
      return;
    }), sleep(2000)]);
    await sleep(200);
    this.kill();
  }
  send(method, params = {}, sessionId) {
    if (!this.conn)
      return Promise.reject(new Error("The browser is not running."));
    return this.conn.send(method, params, sessionId);
  }
  onEvent(method, params, sessionId) {
    if (method === "Target.attachedToTarget") {
      this.onAttached(params);
      return;
    }
    if (method === "Target.detachedFromTarget" || method === "Target.targetDestroyed") {
      const tab = params.sessionId ? this.bySession.get(params.sessionId) : this.byTarget.get(params.targetId);
      if (tab)
        this.forget(tab);
      return;
    }
    if (method === "Target.targetInfoChanged") {
      const info = params.targetInfo;
      const tab = info && this.byTarget.get(info.targetId);
      if (tab) {
        const titleChanged = tab.title !== info.title;
        tab.title = info.title ?? tab.title;
        tab.url = info.url ?? tab.url;
        if (titleChanged && tab.id === this.shownTabId)
          this.touch();
      }
      return;
    }
    const tab = sessionId ? this.bySession.get(sessionId) : undefined;
    if (!tab)
      return;
    switch (method) {
      case "Page.frameStartedLoading":
        if (!tab.mainFrameId || params.frameId === tab.mainFrameId) {
          tab.loading = true;
          tab.loadSeq += 1;
        }
        break;
      case "Page.frameStoppedLoading":
        if (!tab.mainFrameId || params.frameId === tab.mainFrameId) {
          tab.loading = false;
          for (const wake of tab.stopWaiters.splice(0))
            wake();
        }
        break;
      case "Page.frameNavigated":
        if (!params.frame?.parentId) {
          tab.mainFrameId = params.frame.id;
          tab.url = params.frame.url + (params.frame.urlFragment ?? "");
          if (tab.id === this.shownTabId)
            this.restartScreencast(tab);
        }
        break;
      case "Page.navigatedWithinDocument":
        if (params.frameId === tab.mainFrameId)
          tab.url = params.url;
        break;
      case "Page.screencastFrame":
        this.send("Page.screencastFrameAck", { sessionId: params.sessionId }, tab.sessionId).catch(() => {
          return;
        });
        if (tab.id === this.shownTabId) {
          const bytes = Buffer.from(params.data, "base64");
          const size = imageSize(bytes) ?? { width: tab.width, height: tab.height };
          this.setFrame({
            bytes,
            mime: "image/jpeg",
            ...size,
            cssWidth: params.metadata?.deviceWidth ?? tab.width,
            cssHeight: params.metadata?.deviceHeight ?? tab.height
          });
        }
        break;
      case "Page.javascriptDialogOpening": {
        const promptText = params.type === "prompt" ? params.defaultPrompt ?? "" : undefined;
        this.send("Page.handleJavaScriptDialog", { accept: true, promptText }, tab.sessionId).catch(() => {
          return;
        });
        this.pushConsole(tab, "warning", `A ${params.type} dialog was shown and accepted automatically: ${String(params.message ?? "").slice(0, 300)}`, "dialog");
        break;
      }
      case "Runtime.consoleAPICalled":
        if (params.type === "error" || params.type === "warning" || params.type === "assert") {
          const frame = params.stackTrace?.callFrames?.[0];
          const source = frame ? `${frame.url}:${frame.lineNumber + 1}` : "console";
          this.pushConsole(tab, params.type === "warning" ? "warning" : "error", summarizeArgs(params.args), source);
        }
        break;
      case "Runtime.exceptionThrown": {
        const details = params.exceptionDetails ?? {};
        const message = details.exception?.description ?? details.text ?? "Uncaught exception";
        this.pushConsole(tab, "error", String(message).split(`
`)[0].slice(0, 500), details.url ? `${details.url}:${(details.lineNumber ?? 0) + 1}` : "page");
        break;
      }
      case "Log.entryAdded": {
        const entry = params.entry ?? {};
        if (entry.level === "error" || entry.level === "warning") {
          this.pushConsole(tab, entry.level, String(entry.text ?? "").slice(0, 500), entry.url ?? entry.source ?? "browser");
        }
        break;
      }
      default:
        break;
    }
  }
  pushConsole(tab, level, message, source) {
    tab.console.push({ level, message, source });
    if (tab.console.length > CONSOLE_KEEP)
      tab.console.splice(0, tab.console.length - CONSOLE_KEEP);
  }
  async onAttached(params) {
    const { sessionId, targetInfo } = params;
    if (targetInfo?.type !== "page") {
      await this.send("Runtime.runIfWaitingForDebugger", {}, sessionId).catch(() => {
        return;
      });
      return;
    }
    if (this.byTarget.has(targetInfo.targetId))
      return;
    const opener = (targetInfo.openerId ? this.byTarget.get(targetInfo.openerId) : undefined) ?? (this.creating === 0 && this.running && this.tabs.size > 0 ? this.shownTab : undefined);
    const mode = opener?.viewportMode ?? this.config.defaultViewport;
    const size = this.sizeFor(mode);
    let markReady = () => {
      return;
    };
    const ready = new Promise((resolve) => {
      markReady = resolve;
    });
    const tab = {
      id: `tab-${this.nextTab}`,
      targetId: targetInfo.targetId,
      sessionId,
      openedBy: opener?.openedBy ?? null,
      url: targetInfo.url ?? "about:blank",
      title: targetInfo.title ?? "",
      mainFrameId: null,
      viewportMode: mode,
      width: size.width,
      height: size.height,
      loading: false,
      loadSeq: 0,
      stopWaiters: [],
      console: [],
      lastUsed: Date.now(),
      ready
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
    const setup = Promise.all([
      this.send("Page.enable", {}, sessionId),
      this.send("Runtime.enable", {}, sessionId),
      this.send("Log.enable", {}, sessionId),
      this.applyViewport(tab),
      this.config.ignoreHttpsErrors ? this.send("Security.setIgnoreCertificateErrors", { ignore: true }, sessionId) : Promise.resolve(),
      this.send("Page.getFrameTree", {}, sessionId).then((tree) => {
        if (tree?.frameTree?.frame?.id)
          tab.mainFrameId = tree.frameTree.frame.id;
      })
    ]);
    const release = this.send("Runtime.runIfWaitingForDebugger", {}, sessionId);
    await Promise.all([setup, release]).catch(() => {});
    markReady();
    if (opener && opener.id === this.shownTabId)
      this.show(tab.id);
  }
  forget(tab) {
    if (!this.tabs.has(tab.id))
      return;
    this.tabs.delete(tab.id);
    this.byTarget.delete(tab.targetId);
    this.bySession.delete(tab.sessionId);
    for (const wake of tab.stopWaiters.splice(0))
      wake();
    if (this.shownTabId === tab.id) {
      this.shownTabId = null;
      const next = [...this.tabs.values()].sort((a, b) => b.lastUsed - a.lastUsed)[0];
      if (next)
        this.show(next.id);
      else {
        this.frame = null;
        this.touch();
      }
    }
  }
  sizeFor(mode) {
    if (mode === "fill")
      return this.panelSize ?? FILL_FALLBACK;
    return VIEWPORTS[mode];
  }
  viewportSummary(tab) {
    if (tab.viewportMode === "fill")
      return { mode: "fill", width: null, height: null };
    return { mode: tab.viewportMode, width: tab.width, height: tab.height };
  }
  async applyViewport(tab) {
    await this.send("Emulation.setDeviceMetricsOverride", {
      width: tab.width,
      height: tab.height,
      deviceScaleFactor: 1,
      mobile: tab.viewportMode === "mobile"
    }, tab.sessionId);
  }
  async setViewport(tab, mode) {
    tab.viewportMode = mode;
    const size = this.sizeFor(mode);
    tab.width = size.width;
    tab.height = size.height;
    await this.applyViewport(tab);
    if (tab.id === this.shownTabId)
      await this.startScreencast(tab);
  }
  async createTab(url, openedBy, viewport) {
    await this.trimTabs();
    this.creating += 1;
    let tab;
    try {
      const { targetId } = await this.send("Target.createTarget", { url: "about:blank", background: true });
      tab = this.byTarget.get(targetId) ?? await Promise.race([
        new Promise((resolve) => {
          this.attachWaiters.set(targetId, resolve);
        }),
        sleep(1e4).then(() => {
          throw new Error("The new tab did not start.");
        })
      ]);
      this.attachWaiters.delete(targetId);
    } finally {
      this.creating -= 1;
    }
    await tab.ready;
    tab.openedBy = openedBy;
    if (viewport && viewport !== tab.viewportMode)
      await this.setViewport(tab, viewport);
    if (url !== "about:blank")
      await this.navigate(tab, url, 30000);
    if (!this.shownTabId)
      this.show(tab.id);
    return tab;
  }
  async trimTabs() {
    while (this.tabs.size >= this.config.maxTabs) {
      const victim = [...this.tabs.values()].filter((tab) => tab.id !== this.shownTabId).sort((a, b) => a.lastUsed - b.lastUsed)[0];
      if (!victim)
        return;
      await this.closeTab(victim);
    }
  }
  async closeTab(tab) {
    if (this.tabs.size === 1) {
      await this.createTab(START_PAGE, null);
    }
    await this.send("Target.closeTarget", { targetId: tab.targetId }).catch(() => {
      return;
    });
    this.forget(tab);
  }
  listTabs() {
    return [...this.tabs.values()].map((tab) => ({
      id: tab.id,
      title: tab.url.startsWith("data:") || tab.title.startsWith("data:") ? "Server Browser" : tab.title,
      url: tab.url.startsWith("data:") ? "about:blank" : tab.url,
      active: tab.id === this.shownTabId
    }));
  }
  waitForStop(tab, timeoutMs) {
    if (!tab.loading)
      return Promise.resolve(true);
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), timeoutMs);
      tab.stopWaiters.push(() => {
        clearTimeout(timer);
        resolve(true);
      });
    });
  }
  async navigate(tab, url, timeoutMs) {
    tab.lastUsed = Date.now();
    tab.console = [];
    const result = await this.send("Page.navigate", { url }, tab.sessionId);
    if (result.errorText) {
      const hint = /CONNECTION_REFUSED|NAME_NOT_RESOLVED|ADDRESS_UNREACHABLE/.test(result.errorText) ? " Nothing answered at that address on the OpenChamber host; check that the dev server is running and the port is right." : "";
      throw new Error(`Could not load ${url}: ${result.errorText}.${hint}`);
    }
    if (!result.loaderId)
      return { settled: true };
    tab.loading = true;
    const settled = await this.waitForStop(tab, timeoutMs);
    if (settled)
      await sleep(250);
    return { settled };
  }
  async withNavigation(tab, action, timeoutMs = 1e4) {
    const before = tab.loadSeq;
    const result = await action();
    await sleep(200);
    if (tab.loadSeq !== before || tab.loading) {
      if (await this.waitForStop(tab, timeoutMs))
        await sleep(200);
    }
    return result;
  }
  async evaluate(tab, expression) {
    const run = () => this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true
    }, tab.sessionId);
    let result;
    try {
      result = await run();
    } catch (error) {
      if (!/context|Cannot find|destroyed/i.test(error.message))
        throw error;
      await this.waitForStop(tab, 5000);
      result = await run();
    }
    if (result.exceptionDetails) {
      const text = result.exceptionDetails.exception?.description ?? result.exceptionDetails.text ?? "script failed";
      throw new Error(`The page threw: ${String(text).split(`
`)[0]}`);
    }
    return result.result?.value;
  }
  async pageUrlAndTitle(tab) {
    const value = await this.evaluate(tab, '({ url: String(location.href), title: String(document.title || "") })').catch(() => null);
    if (value) {
      tab.url = value.url;
      tab.title = value.title;
    }
    if (tab.url.startsWith("data:"))
      return { url: "about:blank", title: "Server Browser" };
    return { url: tab.url, title: tab.title };
  }
  async evaluateHistory(tab) {
    const history = await this.send("Page.getNavigationHistory", {}, tab.sessionId);
    return { currentIndex: history.currentIndex ?? 0, entries: history.entries ?? [] };
  }
  async goToHistoryEntry(tab, entryId) {
    await this.send("Page.navigateToHistoryEntry", { entryId }, tab.sessionId);
  }
  async reload(tab) {
    await this.send("Page.reload", {}, tab.sessionId);
  }
  async mouseClick(tab, x, y) {
    const base = { x, y, button: "left", clickCount: 1 };
    await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y }, tab.sessionId);
    await this.send("Input.dispatchMouseEvent", { ...base, type: "mousePressed", buttons: 1 }, tab.sessionId);
    await this.send("Input.dispatchMouseEvent", { ...base, type: "mouseReleased", buttons: 0 }, tab.sessionId);
  }
  async pressEnter(tab) {
    const key = { key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 };
    await this.send("Input.dispatchKeyEvent", { ...key, type: "keyDown", text: "\r", unmodifiedText: "\r" }, tab.sessionId);
    await this.send("Input.dispatchKeyEvent", { ...key, type: "keyUp" }, tab.sessionId);
  }
  async insertText(tab, text) {
    await this.send("Input.insertText", { text }, tab.sessionId);
  }
  async deleteSelection(tab) {
    const key = { key: "Delete", code: "Delete", windowsVirtualKeyCode: 46, nativeVirtualKeyCode: 46 };
    await this.send("Input.dispatchKeyEvent", { ...key, type: "rawKeyDown" }, tab.sessionId);
    await this.send("Input.dispatchKeyEvent", { ...key, type: "keyUp" }, tab.sessionId);
  }
  async screenshot(tab, format) {
    const result = await this.send("Page.captureScreenshot", format === "jpeg" ? { format, quality: this.config.screencastQuality } : { format }, tab.sessionId);
    return Buffer.from(result.data, "base64");
  }
  show(tabId) {
    const tab = this.tabs.get(tabId);
    if (!tab)
      return;
    const previous = this.shownTabId ? this.tabs.get(this.shownTabId) : undefined;
    if (previous && previous.id !== tab.id) {
      this.send("Page.stopScreencast", {}, previous.sessionId).catch(() => {
        return;
      });
    }
    if (previous?.id === tab.id && this.frame)
      return;
    this.shownTabId = tab.id;
    tab.lastUsed = Date.now();
    this.send("Target.activateTarget", { targetId: tab.targetId }).catch(() => {
      return;
    });
    this.startScreencast(tab);
  }
  async startScreencast(tab) {
    await this.send("Page.stopScreencast", {}, tab.sessionId).catch(() => {
      return;
    });
    this.tabFirstSeq = this.seq + 1;
    try {
      const bytes = await this.screenshot(tab, "jpeg");
      const size = imageSize(bytes) ?? { width: tab.width, height: tab.height };
      if (tab.id === this.shownTabId) {
        this.setFrame({ bytes, mime: "image/jpeg", ...size, cssWidth: tab.width, cssHeight: tab.height });
      }
    } catch {}
    await this.send("Page.startScreencast", {
      format: "jpeg",
      quality: this.config.screencastQuality,
      maxWidth: tab.width,
      maxHeight: tab.height,
      everyNthFrame: 1
    }, tab.sessionId).catch(() => {
      return;
    });
  }
  restartTimer = null;
  restartScreencast(tab) {
    if (this.restartTimer)
      clearTimeout(this.restartTimer);
    this.restartTimer = setTimeout(() => {
      this.restartTimer = null;
      if (tab.id !== this.shownTabId || !this.tabs.has(tab.id))
        return;
      (async () => {
        await this.send("Page.stopScreencast", {}, tab.sessionId).catch(() => {
          return;
        });
        await this.send("Page.startScreencast", {
          format: "jpeg",
          quality: this.config.screencastQuality,
          maxWidth: tab.width,
          maxHeight: tab.height,
          everyNthFrame: 1
        }, tab.sessionId).catch(() => {
          return;
        });
      })();
    }, 50);
  }
  setFrame(frame) {
    this.frame = frame;
    this.touch();
  }
  touch() {
    this.seq += 1;
    for (const wake of this.frameWaiters.splice(0))
      wake();
  }
  currentFrame() {
    return this.frame;
  }
  waitForFrame(after, waitMs) {
    if (this.seq > after && this.frame)
      return Promise.resolve();
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, waitMs);
      this.frameWaiters.push(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
  markAgentActive() {
    const wasActive = Date.now() < this.agentActiveUntil;
    this.agentActiveUntil = Date.now() + 3000;
    if (!wasActive)
      this.touch();
    if (this.agentActiveTimer)
      clearTimeout(this.agentActiveTimer);
    this.agentActiveTimer = setTimeout(() => this.touch(), 3050);
  }
  get shownTab() {
    return this.shownTabId ? this.tabs.get(this.shownTabId) : undefined;
  }
  async resizeForPanel(width, height) {
    this.panelSize = {
      width: Math.max(320, Math.min(2560, Math.round(width))),
      height: Math.max(240, Math.min(1600, Math.round(height)))
    };
    const tab = this.shownTab;
    if (!tab)
      return this.panelSize;
    if (tab.viewportMode === "fill")
      await this.setViewport(tab, "fill");
    return { width: tab.width, height: tab.height };
  }
  toPage(x, y) {
    const frame = this.frame;
    if (!frame || !frame.width || !frame.height)
      return { x, y };
    return { x: x * frame.cssWidth / frame.width, y: y * frame.cssHeight / frame.height };
  }
  async userPointer(tab, action, px, py, button, buttons, modifiers) {
    const { x, y } = this.toPage(px, py);
    const name = button === 0 ? "left" : button === 1 ? "middle" : button === 2 ? "right" : "none";
    if (action === "move") {
      await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y, buttons, modifiers, button: buttons & 1 ? "left" : "none" }, tab.sessionId);
      return;
    }
    if (action === "down") {
      const now = Date.now();
      const near = Math.abs(this.lastDown.x - x) < 6 && Math.abs(this.lastDown.y - y) < 6;
      const count = near && this.lastDown.button === button && now - this.lastDown.at < 500 ? this.lastDown.count + 1 : 1;
      this.lastDown = { at: now, x, y, button, count };
    }
    await this.send("Input.dispatchMouseEvent", {
      type: action === "down" ? "mousePressed" : "mouseReleased",
      x,
      y,
      button: name,
      buttons,
      modifiers,
      clickCount: this.lastDown.count || 1
    }, tab.sessionId);
  }
  async userWheel(tab, px, py, deltaX, deltaY, modifiers) {
    const { x, y } = this.toPage(px, py);
    await this.send("Input.dispatchMouseEvent", { type: "mouseWheel", x, y, deltaX, deltaY, modifiers }, tab.sessionId);
  }
  async dispatchKey(tab, params) {
    await this.send("Input.dispatchKeyEvent", params, tab.sessionId);
  }
}

// service/keys.ts
var modifierBits = (modifiers) => (modifiers.alt ? 1 : 0) | (modifiers.ctrl ? 2 : 0) | (modifiers.meta ? 4 : 0) | (modifiers.shift ? 8 : 0);
var NAMED = {
  Backspace: 8,
  Tab: 9,
  Enter: 13,
  Shift: 16,
  Control: 17,
  Alt: 18,
  Pause: 19,
  CapsLock: 20,
  Escape: 27,
  " ": 32,
  PageUp: 33,
  PageDown: 34,
  End: 35,
  Home: 36,
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  Insert: 45,
  Delete: 46,
  Meta: 91,
  ContextMenu: 93,
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123
};
var BY_CODE = {
  Semicolon: 186,
  Equal: 187,
  Comma: 188,
  Minus: 189,
  Period: 190,
  Slash: 191,
  Backquote: 192,
  BracketLeft: 219,
  Backslash: 220,
  BracketRight: 221,
  Quote: 222,
  Space: 32,
  NumpadMultiply: 106,
  NumpadAdd: 107,
  NumpadSubtract: 109,
  NumpadDecimal: 110,
  NumpadDivide: 111
};
var keyCode = (key, code) => {
  if (NAMED[key] !== undefined)
    return NAMED[key];
  if (code.startsWith("Key") && code.length === 4)
    return code.charCodeAt(3);
  if (code.startsWith("Digit") && code.length === 6)
    return code.charCodeAt(5);
  if (code.startsWith("Numpad") && /^Numpad\d$/.test(code))
    return 96 + Number(code.slice(6));
  if (BY_CODE[code] !== undefined)
    return BY_CODE[code];
  if (key.length === 1)
    return key.toUpperCase().charCodeAt(0);
  return 0;
};
var EDIT_CHORDS = new Set(["a", "c", "v", "x", "z", "y"]);
var shouldMapMetaToCtrl = (event) => event.modifiers.meta && !event.modifiers.ctrl && EDIT_CHORDS.has(event.key.toLowerCase());
var keyEventParams = (event) => {
  const code = keyCode(event.key, event.code);
  const base = {
    key: event.key,
    code: event.code,
    windowsVirtualKeyCode: code,
    nativeVirtualKeyCode: code,
    modifiers: modifierBits(event.modifiers)
  };
  if (event.action === "up")
    return { ...base, type: "keyUp" };
  const printable = event.key.length === 1 && !event.modifiers.ctrl && !event.modifiers.meta;
  if (printable)
    return { ...base, type: "keyDown", text: event.key, unmodifiedText: event.key };
  if (event.key === "Enter")
    return { ...base, type: "keyDown", text: "\r", unmodifiedText: "\r" };
  return { ...base, type: "rawKeyDown" };
};

// service/main.ts
var port = Number(process.env.OPENCHAMBER_SERVICE_PORT);
var token = process.env.OPENCHAMBER_SERVICE_TOKEN ?? "";
if (!port || !token) {
  console.error("OPENCHAMBER_SERVICE_PORT and OPENCHAMBER_SERVICE_TOKEN are required");
  process.exit(1);
}
var browser = new ServerBrowser;
var queue = Promise.resolve();
var serialized = (work) => {
  const next = queue.then(work, work);
  queue = next.catch(() => {
    return;
  });
  return next;
};
var readBody = (req, limit = 1e6) => new Promise((resolve, reject) => {
  const chunks = [];
  let size = 0;
  req.on("data", (chunk) => {
    size += chunk.length;
    if (size > limit) {
      reject(new Error("body too large"));
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  req.on("error", reject);
});
var sendJson = (res, status, body) => {
  const text = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(text) });
  res.end(text);
};
var parseJson = (text) => {
  try {
    const value = JSON.parse(text);
    return value && typeof value === "object" && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
};
var handleBrowserControl = async (req, res) => {
  const request = readBrowserProviderRequest(await readBody(req, 2000000));
  if (!request) {
    sendJson(res, 400, { ok: false, error: "Not a browser action" });
    return;
  }
  let result;
  try {
    result = await serialized(() => handleAction(browser, request));
  } catch (error) {
    result = { ok: false, error: error.message || "The browser action failed." };
  }
  sendJson(res, 200, result);
};
var handleFrame = async (res, url) => {
  const after = Number(url.searchParams.get("after") ?? "0") || 0;
  const wait = Math.min(Math.max(Number(url.searchParams.get("wait") ?? "0") || 0, 0), 25000);
  if (!browser.running) {
    await browser.ensure().catch(() => {
      return;
    });
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
  const title = (shown?.title || shown?.url || "Server Browser").slice(0, SURFACE_TITLE_MAX);
  const headers = {
    "Content-Type": frame.mime,
    "Content-Length": frame.bytes.length,
    [SURFACE_SEQ_HEADER]: String(browser.seq),
    [SURFACE_WIDTH_HEADER]: String(frame.width),
    [SURFACE_HEIGHT_HEADER]: String(frame.height),
    [SURFACE_TITLE_HEADER]: title.replace(/[^\x20-\x7e\xa0-\xff]/g, "")
  };
  if (Date.now() < browser.agentActiveUntil)
    headers[SURFACE_AGENT_ACTIVE_HEADER] = "1";
  res.writeHead(200, headers);
  res.end(frame.bytes);
};
var coalesceHoverMoves = (events) => {
  const kept = [];
  for (const event of events) {
    const previous = kept[kept.length - 1];
    const bothHoverMoves = event.type === "pointer" && event.action === "move" && event.buttons === 0 && previous?.type === "pointer" && previous.action === "move" && previous.buttons === 0;
    if (bothHoverMoves)
      kept[kept.length - 1] = event;
    else
      kept.push(event);
  }
  return kept;
};
var applyInput = async (events) => {
  const tab = browser.shownTab;
  if (!tab)
    return;
  for (const event of coalesceHoverMoves(events)) {
    if (event.type === "pointer") {
      browser.userPointer(tab, event.action, event.x, event.y, event.button, event.buttons, modifierBits(event.modifiers)).catch(() => {
        return;
      });
    } else if (event.type === "wheel") {
      await browser.userWheel(tab, event.x, event.y, event.deltaX, event.deltaY, modifierBits(event.modifiers)).catch(() => {
        return;
      });
    } else if (event.type === "key") {
      const modifiers = shouldMapMetaToCtrl(event) ? { ...event.modifiers, meta: false, ctrl: true } : event.modifiers;
      await browser.dispatchKey(tab, keyEventParams({ ...event, modifiers })).catch(() => {
        return;
      });
    } else if (event.type === "text") {
      await browser.insertText(tab, event.text).catch(() => {
        return;
      });
    }
  }
};
var handleSurface = async (req, res, url) => {
  if (url.pathname === SURFACE_FRAME_PATH && req.method === "GET") {
    await handleFrame(res, url);
    return true;
  }
  if (url.pathname === SURFACE_INPUT_PATH && req.method === "POST") {
    const batch = readSurfaceInputBatch(await readBody(req));
    if (!batch) {
      res.writeHead(400);
      res.end();
      return true;
    }
    const drawn = Number(req.headers[SURFACE_FRAME_SEQ_HEADER] ?? "0") || 0;
    if (drawn > 0 && drawn < browser.tabFirstSeq) {
      res.writeHead(409);
      res.end();
      return true;
    }
    await applyInput(batch.events);
    res.writeHead(204);
    res.end();
    return true;
  }
  if (url.pathname === SURFACE_CONTROL_PATH && req.method === "POST") {
    const notice = readSurfaceControlNotice(await readBody(req));
    if (!notice) {
      res.writeHead(400);
      res.end();
      return true;
    }
    browser.controller = notice.controller;
    browser.controllingViewer = notice.controller === "user" ? notice.viewer ?? null : null;
    res.writeHead(204);
    res.end();
    return true;
  }
  if (url.pathname === SURFACE_RESIZE_PATH && req.method === "POST") {
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
  if (url.pathname === SURFACE_CLIPBOARD_PATH && req.method === "GET") {
    const tab = browser.shownTab;
    const text = tab ? await browser.evaluate(tab, SELECTION_SCRIPT).catch(() => "") : "";
    sendJson(res, 200, { text: String(text ?? "") });
    return true;
  }
  return false;
};
var dockBlocked = (req) => {
  if (browser.controller !== "user" || !browser.controllingViewer)
    return false;
  const viewer = req.headers[SURFACE_VIEWER_HEADER];
  return typeof viewer === "string" && viewer !== browser.controllingViewer;
};
var normalizeAddress = (input) => {
  const value = input.trim();
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) || /^(about|data|blob|view-source):/i.test(value))
    return value;
  const host = value.split("/")[0].split(":")[0];
  const local = host === "localhost" || host.endsWith(".localhost") || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.endsWith(".test");
  return `${local ? "http" : "https"}://${value}`;
};
var handleDock = async (req, res, url) => {
  if (url.pathname === "/state" && req.method === "GET") {
    const shown = browser.shownTab;
    sendJson(res, 200, {
      running: browser.running,
      error: browser.lastError,
      url: shown && !shown.url.startsWith("data:") ? shown.url : "",
      title: shown?.title ?? "",
      loading: shown?.loading ?? false,
      viewport: shown ? shown.viewportMode : browser.config.defaultViewport,
      tabs: browser.listTabs(),
      controller: browser.controller,
      agentActive: Date.now() < browser.agentActiveUntil
    });
    return true;
  }
  if (req.method !== "POST" || !["/navigate", "/tab", "/nav", "/viewport", "/restart"].includes(url.pathname))
    return false;
  if (dockBlocked(req)) {
    sendJson(res, 409, { ok: false, error: "Someone else is in control of the browser." });
    return true;
  }
  const body = parseJson(await readBody(req)) ?? {};
  try {
    if (url.pathname === "/restart") {
      browser.kill();
      await browser.ensure();
      sendJson(res, 200, { ok: true });
      return true;
    }
    await browser.ensure();
    const tab = browser.shownTab;
    if (url.pathname === "/navigate") {
      const address = typeof body.url === "string" ? body.url : "";
      if (!address.trim()) {
        sendJson(res, 400, { ok: false, error: "url is required" });
        return true;
      }
      if (!tab)
        throw new Error("No tab is open.");
      browser.navigate(tab, normalizeAddress(address), 30000).catch(() => {
        return;
      });
    } else if (url.pathname === "/tab") {
      const id = typeof body.id === "string" ? body.id : "";
      if (!browser.tabs.has(id))
        throw new Error(`No tab ${id}`);
      browser.show(id);
    } else if (url.pathname === "/nav") {
      if (!tab)
        throw new Error("No tab is open.");
      if (body.action === "reload")
        await browser.reload(tab);
      else {
        const history = await browser.evaluateHistory(tab);
        const entry = history.entries[history.currentIndex + (body.action === "forward" ? 1 : -1)];
        if (entry)
          await browser.goToHistoryEntry(tab, entry.id);
      }
    } else if (url.pathname === "/viewport") {
      const mode = body.mode;
      if (!tab || mode !== "mobile" && mode !== "tablet" && mode !== "desktop" && mode !== "fill")
        throw new Error("Unknown viewport");
      await browser.setViewport(tab, mode);
    }
    sendJson(res, 200, { ok: true });
  } catch (error) {
    sendJson(res, 200, { ok: false, error: error.message });
  }
  return true;
};
var server = http.createServer((req, res) => {
  if (req.headers.authorization !== `Bearer ${token}`) {
    sendJson(res, 401, { ok: false, error: "unauthorized" });
    return;
  }
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const route = async () => {
    if (url.pathname === "/health") {
      sendJson(res, 200, { ok: true });
      return;
    }
    if (url.pathname === BROWSER_PROVIDER_PATH && req.method === "POST") {
      await handleBrowserControl(req, res);
      return;
    }
    if (url.pathname.startsWith("/surface/") && await handleSurface(req, res, url))
      return;
    if (await handleDock(req, res, url))
      return;
    sendJson(res, 404, { ok: false, error: "not-found" });
  };
  route().catch((error) => {
    if (!res.headersSent)
      sendJson(res, 500, { ok: false, error: error.message });
    else
      res.end();
  });
});
server.listen(port, "127.0.0.1");
var stopping = false;
var shutdown = () => {
  if (stopping)
    return;
  stopping = true;
  server.close();
  browser.close().finally(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
process.on("exit", () => browser.kill());
