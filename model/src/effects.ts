import { unicodeName } from "unicode-name"
import type { DeadKeyEffect } from "./generated/layout.js"

type DeadKeyName = DeadKeyEffect["dead"]

/**
 * Reference glyph → `{ dead: "..." }` value for dead keys that are exact
 * after Unicode normalization when implemented as base character + one
 * fixed combining mark. See `dead-key-normalization.md`.
 */
const EXACT_DEAD_KEY_GLYPH_TO_VALUE: Readonly<Record<string, DeadKeyName>> = {
  // T1 / Tote Taste 1
  ˆ: "COMBINING CIRCUMFLEX ACCENT",
  ˇ: "COMBINING CARON",
  "˙": "COMBINING DOT ABOVE",

  // T2 / Tote Taste 2
  ˋ: "COMBINING GRAVE ACCENT",
  "`": "COMBINING GRAVE ACCENT",
  "¨": "COMBINING DIAERESIS",
  "῾": "COMBINING REVERSED COMMA ABOVE",

  // T3 / Tote Taste 3
  ˊ: "COMBINING ACUTE ACCENT",
  "´": "COMBINING ACUTE ACCENT",
  "˝": "COMBINING DOUBLE ACUTE ACCENT",
  "˘": "COMBINING BREVE",

  // Keypad glyph `vec` stands for U+20D7. It is not one of Neo's 18 dead
  // keys, but it is a combining mark and therefore uses `{ dead: "..." }`.
  vec: "COMBINING RIGHT ARROW ABOVE",
}

/**
 * Reference glyph → documented `NEO DEAD …` constant for dead keys that
 * cannot be represented exactly by a single combining character. See
 * `dead-key-normalization.md`.
 */
const NEO_DEAD_KEY_GLYPH_TO_NAME: Readonly<Record<string, DeadKeyName>> = {
  // T1 / Tote Taste 1
  "↻": "NEO DEAD ROTATE",
  "˞": "NEO DEAD HOOK",
  ".": "NEO DEAD DOT BELOW",

  // T2 / Tote Taste 2
  "¸": "NEO DEAD CEDILLA",
  "˚": "NEO DEAD RING",
  "¯": "NEO DEAD MACRON",

  // T3 / Tote Taste 3
  "˜": "NEO DEAD TILDE",
  "/": "NEO DEAD STROKE",
  "᾿": "NEO DEAD SPIRITUS LENIS",
}

const WHITESPACE_PATTERN = /^\s$/u

/**
 * Visible reference symbols that stand in for whitespace characters in the
 * A-REFERENZ-A drawings.
 */
const WHITESPACE_SYMBOLS: Readonly<Record<string, string>> = {
  "␣": "\u0020",
  "⍽": "\u00A0",
  "¦": "\u202F",
}

/** Returns the Unicode name for a whitespace character or whitespace symbol. */
export function getWhitespaceName(char: string): string | undefined {
  const actualWhitespace = WHITESPACE_SYMBOLS[char]
  if (actualWhitespace !== undefined) return unicodeName(actualWhitespace)
  if (!WHITESPACE_PATTERN.test(char)) return undefined
  return unicodeName(char)
}

/**
 * Resolves a reference glyph to the value used in `{ dead: "..." }`.
 *
 * * Exact dead keys and the keypad `vec` glyph are resolved to the official
 *   Unicode name of their combining character.
 * * Neo-specific dead keys that have no exact combining-character equivalent
 *   are resolved to their documented `NEO DEAD …` constant.
 * * Single-character glyphs are only resolved when they appear on a physical
 *   key that hosts a Neo dead key, because glyphs like `.` are also valid
 *   plain characters elsewhere on the layout.
 * * Multi-character abbreviations (e.g. `vec`) are unambiguous and resolved
 *   regardless of the physical key code.
 */
export function glyphToDeadKeyName(
  code: string,
  glyph: string,
): DeadKeyName | undefined {
  if (glyph.length === 1 && !isDeadKeyCode(code)) return undefined
  return (
    NEO_DEAD_KEY_GLYPH_TO_NAME[glyph] ?? EXACT_DEAD_KEY_GLYPH_TO_VALUE[glyph]
  )
}

/** Physical codes that host dead keys in Neo-family layouts. */
const DEAD_KEY_CODES: Readonly<Set<string>> = new Set([
  "Backquote",
  "Equal",
  "BracketRight",
])

/** Returns true if the given physical code hosts a dead key. */
function isDeadKeyCode(code: string): boolean {
  return DEAD_KEY_CODES.has(code)
}
