// Turns the keys a person presses on the shared surface into CDP key events.
import type { SurfaceKeyEvent, SurfaceModifiers } from '@openchamber/sdk';

import type { CdpParams } from './cdp.ts';

/** CDP's modifier bitmask: Alt 1, Ctrl 2, Meta 4, Shift 8. */
export const modifierBits = (modifiers: SurfaceModifiers): number => (
  (modifiers.alt ? 1 : 0) | (modifiers.ctrl ? 2 : 0) | (modifiers.meta ? 4 : 0) | (modifiers.shift ? 8 : 0)
);

const NAMED: Record<string, number> = {
  Backspace: 8, Tab: 9, Enter: 13, Shift: 16, Control: 17, Alt: 18, Pause: 19, CapsLock: 20,
  Escape: 27, ' ': 32, PageUp: 33, PageDown: 34, End: 35, Home: 36,
  ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40, Insert: 45, Delete: 46,
  Meta: 91, ContextMenu: 93,
  F1: 112, F2: 113, F3: 114, F4: 115, F5: 116, F6: 117, F7: 118, F8: 119, F9: 120, F10: 121, F11: 122, F12: 123,
};

const BY_CODE: Record<string, number> = {
  Semicolon: 186, Equal: 187, Comma: 188, Minus: 189, Period: 190, Slash: 191, Backquote: 192,
  BracketLeft: 219, Backslash: 220, BracketRight: 221, Quote: 222, Space: 32,
  NumpadMultiply: 106, NumpadAdd: 107, NumpadSubtract: 109, NumpadDecimal: 110, NumpadDivide: 111,
};

const keyCode = (key: string, code: string): number => {
  if (NAMED[key] !== undefined) return NAMED[key];
  if (code.startsWith('Key') && code.length === 4) return code.charCodeAt(3);
  if (code.startsWith('Digit') && code.length === 6) return code.charCodeAt(5);
  if (code.startsWith('Numpad') && /^Numpad\d$/.test(code)) return 96 + Number(code.slice(6));
  if (BY_CODE[code] !== undefined) return BY_CODE[code];
  if (key.length === 1) return key.toUpperCase().charCodeAt(0);
  return 0;
};

const EDIT_CHORDS = new Set(['a', 'c', 'v', 'x', 'z', 'y']);

/**
 * The page runs in Chrome on Linux, where editing shortcuts use Ctrl. A Mac
 * user presses Cmd; send those few chords as Ctrl so select-all, undo and
 * friends do what they expect.
 */
export const shouldMapMetaToCtrl = (event: SurfaceKeyEvent): boolean => (
  event.modifiers.meta && !event.modifiers.ctrl && EDIT_CHORDS.has(event.key.toLowerCase())
);

export const keyEventParams = (event: SurfaceKeyEvent): CdpParams => {
  const code = keyCode(event.key, event.code);
  const base: CdpParams = {
    key: event.key,
    code: event.code,
    windowsVirtualKeyCode: code,
    nativeVirtualKeyCode: code,
    modifiers: modifierBits(event.modifiers),
  };
  if (event.action === 'up') return { ...base, type: 'keyUp' };
  const printable = event.key.length === 1 && !event.modifiers.ctrl && !event.modifiers.meta;
  if (printable) return { ...base, type: 'keyDown', text: event.key, unmodifiedText: event.key };
  if (event.key === 'Enter') return { ...base, type: 'keyDown', text: '\r', unmodifiedText: '\r' };
  return { ...base, type: 'rawKeyDown' };
};
