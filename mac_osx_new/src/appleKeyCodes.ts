import type { KeyCode } from "neo-layout-model"

/**
 * Maps each W3C UI Events `KeyboardEvent.code` value defined in
 * `model/layout.schema.yaml` to the Apple virtual key code used in the
 * `code` attribute of `<key>` elements in macOS `.keylayout` files.
 *
 * Apple virtual key codes identify physical key positions, not the characters
 * printed on the key caps. The decimal values correspond to the constants in
 * `<Carbon/Carbon.h>` (for example `kVK_ANSI_A` = 0x00 = 0).
 */
export const APPLE_VIRTUAL_KEY_CODES: { [K in KeyCode]: number } = {
  // Row E (number row)
  Backquote: 50,
  Digit1: 18,
  Digit2: 19,
  Digit3: 20,
  Digit4: 21,
  Digit5: 23,
  Digit6: 22,
  Digit7: 26,
  Digit8: 28,
  Digit9: 25,
  Digit0: 29,
  Minus: 27,
  Equal: 24,

  // Row D (top letter row)
  Tab: 48,
  KeyQ: 12,
  KeyW: 13,
  KeyE: 14,
  KeyR: 15,
  KeyT: 17,
  KeyY: 16,
  KeyU: 32,
  KeyI: 34,
  KeyO: 31,
  KeyP: 35,
  BracketLeft: 33,
  BracketRight: 30,

  // Row C (home row)
  KeyA: 0,
  KeyS: 1,
  KeyD: 2,
  KeyF: 3,
  KeyG: 5,
  KeyH: 4,
  KeyJ: 38,
  KeyK: 40,
  KeyL: 37,
  Semicolon: 41,
  Quote: 39,

  // Row B (bottom letter row)
  KeyZ: 6,
  KeyX: 7,
  KeyC: 8,
  KeyV: 9,
  KeyB: 11,
  KeyN: 45,
  KeyM: 46,
  Comma: 43,
  Period: 47,
  Slash: 44,

  // Row A (space row)
  Space: 49,

  // Numpad
  NumLock: 71,
  NumpadDivide: 75,
  NumpadMultiply: 67,
  NumpadSubtract: 78,
  Numpad7: 89,
  Numpad8: 91,
  Numpad9: 92,
  NumpadAdd: 69,
  Numpad4: 86,
  Numpad5: 87,
  Numpad6: 88,
  Numpad1: 83,
  Numpad2: 84,
  Numpad3: 85,
  NumpadEnter: 76,
  Numpad0: 82,
  NumpadDecimal: 65,
}
