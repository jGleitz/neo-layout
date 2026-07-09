import { MAIN_PANEL_CODES } from "./codes.js";
import { getWhitespaceName, glyphToDeadKeyName } from "./effects.js";
import type { KeyEffect, Neo2FamilyLayout } from "./generated/layout.js";

const MAIN_PANEL_HEADER = "=== Alle Ebenen – Haupttastatur ===";
const KEYPAD_PANEL_HEADER = "=== Alle Ebenen – Ziffernblock ===";

const BOX_CHARS = "│─┌┐└┘├┤┬┴┼";
const LEVEL_NAMES = [
  "level1",
  "level2",
  "level3",
  "level4",
  "level5",
  "level6",
] as const;

const LABEL_TO_EFFECT: Readonly<Record<string, KeyEffect>> = {
  "⇥": { key: "Tab" },
  "⇤": { key: "NeoBacktab" },
  Tab: { key: "Tab" },
  "⌫": { key: "Backspace" },
  Backspace: { key: "Backspace" },
  "⌦": { key: "Delete" },
  Del: { key: "Delete" },
  "⌧": { key: "Escape" },
  "⎀": { key: "Insert" },
  Ins: { key: "Insert" },
  "⇠": { key: "ArrowLeft" },
  "←": { key: "ArrowLeft" },
  "KP←": { key: "ArrowLeft" },
  "⇡": { key: "ArrowUp" },
  "↑": { key: "ArrowUp" },
  "KP↑": { key: "ArrowUp" },
  "⇢": { key: "ArrowRight" },
  "→": { key: "ArrowRight" },
  "KP→": { key: "ArrowRight" },
  "⇣": { key: "ArrowDown" },
  "↓": { key: "ArrowDown" },
  "KP↓": { key: "ArrowDown" },
  "⇱": { key: "Home" },
  Hom: { key: "Home" },
  "⇲": { key: "End" },
  End: { key: "End" },
  Beg: { key: "Clear" },
  "⇞": { key: "PageUp" },
  PgU: { key: "PageUp" },
  "⇟": { key: "PageDown" },
  PgD: { key: "PageDown" },
  "♫": { key: "Compose" },
  "⏎": { key: "Enter" },
  Enter: { key: "Enter" },
  Return: { key: "Enter" },
};

const LEVEL4_KEYPAD_GLYPH_TO_KEY: Readonly<Record<string, KeyEffect>> = {
  "0": { key: "NeoNumpad0" },
  "1": { key: "NeoNumpad1" },
  "2": { key: "NeoNumpad2" },
  "3": { key: "NeoNumpad3" },
  "4": { key: "NeoNumpad4" },
  "5": { key: "NeoNumpad5" },
  "6": { key: "NeoNumpad6" },
  "7": { key: "NeoNumpad7" },
  "8": { key: "NeoNumpad8" },
  "9": { key: "NeoNumpad9" },
  "+": { key: "NeoNumpadAdd" },
  "-": { key: "NeoNumpadSubtract" },
  "−": { key: "NeoNumpadSubtract" },
  "*": { key: "NeoNumpadMultiply" },
  "×": { key: "NeoNumpadMultiply" },
  "/": { key: "NeoNumpadDivide" },
  "⁄": { key: "NeoNumpadDivide" },
  ",": { key: "NeoNumpadDecimal" },
};

export function parseNeoReference(
  source: string,
  name: string,
  description: string,
): Omit<Neo2FamilyLayout, "$schema"> {
  const levels = createEmptyLevels();

  parseMainPanel(extractPanelRows(source, MAIN_PANEL_HEADER), levels);
  parseKeypadPanel(extractPanelRows(source, KEYPAD_PANEL_HEADER), levels);

  return { name, description, levels };
}

function createEmptyLevels(): Neo2FamilyLayout["levels"] {
  return {
    level1: {},
    level2: {},
    level3: {},
    level4: {},
    level5: {},
    level6: {},
  };
}

type PanelRows = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

function extractPanelRows(source: string, header: string): PanelRows {
  const lines = source.split(/\r?\n/u);
  const headerIndex = lines.indexOf(header);
  if (headerIndex === -1) {
    throw new Error(`Neo reference panel not found: ${header}`);
  }

  const nextHeaderIndex = lines.findIndex(
    (line, index) => index > headerIndex && line.startsWith("==="),
  );
  const panelLines = lines.slice(
    headerIndex + 1,
    nextHeaderIndex === -1 ? lines.length : nextHeaderIndex,
  );

  const panelRows = panelLines.filter(isPanelContentRow);

  if (panelRows.length !== 10) {
    throw new Error(
      `Expected 10 main panel content rows, got ${panelRows.length}`,
    );
  }
  return panelRows as PanelRows;
}

function isPanelContentRow(line: string): boolean {
  if (!line.includes("│")) return false;
  return Array.from(line).some(
    (char) => !BOX_CHARS.includes(char) && !/\s/u.test(char),
  );
}

function parseMainPanel(
  rows: PanelRows,
  levels: Neo2FamilyLayout["levels"],
): void {
  parseMainCodeRow(rows[0], rows[1], MAIN_PANEL_CODES[0], 0, levels);
  parseMainCodeRow(rows[2], rows[3], MAIN_PANEL_CODES[1], 0, levels);
  parseMainCodeRow(rows[4], rows[5], MAIN_PANEL_CODES[2], 1, levels);
  parseMainCodeRow(rows[6], rows[7], MAIN_PANEL_CODES[3], 2, levels);
  assignLevels(levels, "Space", parseSpaceCell());
}

function parseMainCodeRow(
  topRow: string,
  bottomRow: string,
  codes: readonly string[],
  skipCells: number,
  levels: Neo2FamilyLayout["levels"],
): void {
  const topCells = splitPanelCells(topRow).slice(skipCells);
  const bottomCells = splitPanelCells(bottomRow).slice(skipCells);

  codes.forEach((code, index) => {
    const values = parseMainCell(
      code,
      topCells[index] ?? "",
      bottomCells[index] ?? "",
    );
    assignLevels(levels, code, values);
  });
}

function splitPanelCells(row: string): string[] {
  const firstSeparator = row.indexOf("│");
  const lastSeparator = row.lastIndexOf("│");
  if (firstSeparator === -1 || lastSeparator <= firstSeparator) return [];
  return row.slice(firstSeparator + 1, lastSeparator).split("│");
}

function parseMainCell(
  code: string,
  topCell: string,
  bottomCell: string,
): KeyEffect[] {
  // The full combined panel renders the Tab key as a multi-character label
  // ("Tab") followed by the actual per-level glyphs. The standard positional
  // parser cannot read that, so we extract the glyphs explicitly. The lock
  // value that appears in the L5 miniature (4Lk / Mod4-Lock) is intentionally
  // omitted here: layer-lock behavior is static layer-selection logic, not
  // layout data, and therefore does not belong in the generated YAML.
  if (code === "Tab") {
    return [
      { key: "Tab" },
      { key: "NeoBacktab" },
      { key: "Compose" },
      null,
      null,
      null,
    ];
  }

  const topGlyphs = charsAt(topCell.padEnd(5, " "), [0, 2, 4]);
  const bottomGlyphs = charsAt(bottomCell.padEnd(5, " "), [0, 2, 4]);
  const top = topGlyphs.map((glyph) => normalizeGlyph(code, glyph));
  const bottom = bottomGlyphs.map((glyph) => normalizeGlyph(code, glyph));
  const values = interleaveBottomTop(bottom, top);

  const keypadVariantEffect =
    LEVEL4_KEYPAD_GLYPH_TO_KEY[topGlyphs[1]?.trim() ?? ""];
  if (keypadVariantEffect !== undefined) {
    values[3] = keypadVariantEffect;
  }

  return values;
}

function parseSpaceCell(): KeyEffect[] {
  const space = { char: getWhitespaceName(" ")! };
  const nbsp = { char: getWhitespaceName("\u00A0")! };
  const narrowNbsp = { char: getWhitespaceName("\u202F")! };
  return [space, space, space, { key: "NeoNumpad0" }, nbsp, narrowNbsp];
}

function parseKeypadPanel(
  rows: PanelRows,
  levels: Neo2FamilyLayout["levels"],
): void {
  if (rows.length !== 10) {
    throw new Error(
      `Expected 10 keypad panel content rows, got ${rows.length}`,
    );
  }

  const pairs = pairRows(rows);
  const firstRow = parseKeypadCells(pairs[0].top, pairs[0].bottom);
  assignLevels(levels, "NumLock", firstRow[0] ?? emptyCell());
  assignLevels(levels, "NumpadDivide", firstRow[1] ?? emptyCell());
  assignLevels(levels, "NumpadMultiply", firstRow[2] ?? emptyCell());
  assignLevels(levels, "NumpadSubtract", firstRow[3] ?? emptyCell());

  const secondRow = parseKeypadCells(pairs[1].top, pairs[1].bottom);
  assignLevels(levels, "Numpad7", secondRow[0] ?? emptyCell());
  assignLevels(levels, "Numpad8", secondRow[1] ?? emptyCell());
  assignLevels(levels, "Numpad9", secondRow[2] ?? emptyCell());

  const thirdRow = parseKeypadCells(pairs[2].top, pairs[2].bottom);
  assignLevels(levels, "Numpad4", thirdRow[0] ?? emptyCell());
  assignLevels(levels, "Numpad5", thirdRow[1] ?? emptyCell());
  assignLevels(levels, "Numpad6", thirdRow[2] ?? emptyCell());
  assignLevels(levels, "NumpadAdd", thirdRow[3] ?? emptyCell());

  const fourthRow = parseKeypadCells(pairs[3].top, pairs[3].bottom);
  assignLevels(levels, "Numpad1", fourthRow[0] ?? emptyCell());
  assignLevels(levels, "Numpad2", fourthRow[1] ?? emptyCell());
  assignLevels(levels, "Numpad3", fourthRow[2] ?? emptyCell());

  const fifthRow = parseKeypadCells(pairs[4].top, pairs[4].bottom);
  assignLevels(levels, "Numpad0", fifthRow[0] ?? emptyCell());
  assignLevels(levels, "NumpadDecimal", fifthRow[1] ?? emptyCell());
  assignLevels(
    levels,
    "NumpadEnter",
    Array.from({ length: 6 }).map((): KeyEffect => ({ key: "Enter" })),
  );
}

type Pair = { top: string; bottom: string };
type PairedRows = [Pair, Pair, Pair, Pair, Pair];

function pairRows(rows: PanelRows): [Pair, Pair, Pair, Pair, Pair] {
  const pairs: Pair[] = [];
  for (let index = 0; index < rows.length; index += 2) {
    const top = rows[index];
    const bottom = rows[index + 1];
    if (top === undefined || bottom === undefined) {
      throw new Error("Panel content rows must come in top/bottom pairs");
    }
    pairs.push({ top, bottom });
  }
  return pairs as PairedRows;
}

function parseKeypadCells(topRow: string, bottomRow: string): KeyEffect[][] {
  const topCells = splitPanelCells(topRow);
  const bottomCells = splitPanelCells(bottomRow);
  const cellCount = Math.max(topCells.length, bottomCells.length);
  const cells: KeyEffect[][] = [];

  for (let index = 0; index < cellCount; index += 1) {
    const top = parseKeypadCellPart(topCells[index] ?? "");
    const bottom = parseKeypadCellPart(bottomCells[index] ?? "");
    cells.push(interleaveBottomTop(bottom, top));
  }

  return cells;
}

function parseKeypadCellPart(cell: string): KeyEffect[] {
  const tokens = cell.trim().split(/\s+/u).filter(Boolean);
  return [0, 1, 2].map((index) => normalizeGlyph("", tokens[index] ?? ""));
}

function charsAt(value: string, indexes: readonly number[]): string[] {
  const chars = Array.from(value);
  return indexes.map((index) => chars[index] ?? "");
}

function interleaveBottomTop(
  bottom: readonly KeyEffect[],
  top: readonly KeyEffect[],
): KeyEffect[] {
  return [
    bottom[0] ?? null,
    top[0] ?? null,
    bottom[1] ?? null,
    top[1] ?? null,
    bottom[2] ?? null,
    top[2] ?? null,
  ];
}

function normalizeGlyph(code: string, glyph: string): KeyEffect {
  const trimmed = glyph.trim();
  if (trimmed === "") return null;

  const deadValue = glyphToDeadKeyName(code, trimmed);
  if (deadValue !== undefined) return { dead: deadValue };

  const whitespaceName = getWhitespaceName(trimmed);
  if (whitespaceName !== undefined) return { char: whitespaceName };

  if (trimmed === "╌") return { char: "SOFT HYPHEN" };

  const namedKey = LABEL_TO_EFFECT[trimmed];
  if (namedKey !== undefined) return namedKey;

  return trimmed;
}

function assignLevels(
  levels: Neo2FamilyLayout["levels"],
  code: string,
  values: readonly KeyEffect[],
): void {
  LEVEL_NAMES.forEach((levelName, index) => {
    levels[levelName][code] = values[index] ?? null;
  });
}

function emptyCell(): KeyEffect[] {
  return [null, null, null, null, null, null];
}
