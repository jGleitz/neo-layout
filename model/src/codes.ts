/**
 * Mapping from panel position (main keyboard or keypad) to W3C
 * KeyboardEvent.code values.
 *
 * These mappings describe a standard ISO 102-key keyboard. Modifier keys that
 * are reserved for Neo layer switching (CapsLock/Backslash for Mod3,
 * IntlBackslash/AltRight for Mod4, the Shift/Ctrl/Meta/Alt/Menu keys and
 * Enter/Backspace) are intentionally omitted because they are not part of the
 * character-producing key set.
 */

import type { KeyCode } from "./generated/layout.js"

/** The main keyboard panel: rows ordered from top (number row) to bottom. */
export const MAIN_PANEL_CODES = [
  // Row E: number row
  [
    "Backquote",
    "Digit1",
    "Digit2",
    "Digit3",
    "Digit4",
    "Digit5",
    "Digit6",
    "Digit7",
    "Digit8",
    "Digit9",
    "Digit0",
    "Minus",
    "Equal",
  ],
  // Row D: top letter row
  [
    "Tab",
    "KeyQ",
    "KeyW",
    "KeyE",
    "KeyR",
    "KeyT",
    "KeyY",
    "KeyU",
    "KeyI",
    "KeyO",
    "KeyP",
    "BracketLeft",
    "BracketRight",
  ],
  // Row C: home row (CapsLock and Backslash/Enter are Mod3/Return modifiers)
  [
    "KeyA",
    "KeyS",
    "KeyD",
    "KeyF",
    "KeyG",
    "KeyH",
    "KeyJ",
    "KeyK",
    "KeyL",
    "Semicolon",
    "Quote",
  ],
  // Row B: bottom letter row (IntlBackslash and Shift are Mod4/Shift modifiers)
  [
    "KeyZ",
    "KeyX",
    "KeyC",
    "KeyV",
    "KeyB",
    "KeyN",
    "KeyM",
    "Comma",
    "Period",
    "Slash",
  ],
  // Row A: space row (all modifiers, except Space itself)
  ["Space"],
] as const satisfies KeyCode[][]

/** The keypad panel: rows ordered from top to bottom. */
export const KEYPAD_PANEL_CODES = [
  ["NumpadDivide", "NumpadMultiply", "NumpadSubtract"],
  ["Numpad7", "Numpad8", "Numpad9", "NumpadAdd"],
  ["Numpad4", "Numpad5", "Numpad6"],
  ["Numpad1", "Numpad2", "Numpad3", "NumpadEnter"],
  ["Numpad0", "NumpadDecimal"],
] as const satisfies KeyCode[][]
