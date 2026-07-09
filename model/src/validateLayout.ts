import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as YAML from "yaml";
import { unicodeName, unicodeType } from "unicode-name";
import { KeyEffect, Neo2FamilyLayout } from "./generated/layout.js";
import { Ajv2020 } from "ajv/dist/2020.js";
import { fullFormats } from "ajv-formats/dist/formats.js";
import type { ValidateFunction } from "ajv";

export const schemaPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "layout.schema.yaml",
);

function loadJsonSchemaValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  ajv.addFormat("uri", fullFormats.uri);
  const schemaContent = YAML.parse(fs.readFileSync(schemaPath, "utf8"));
  return ajv.compile<Neo2FamilyLayout>(schemaContent);
}

let jsonSchemaValidator: ValidateFunction<Neo2FamilyLayout> | undefined;

export function validateLayout(layout: unknown): Neo2FamilyLayout | string[] {
  jsonSchemaValidator ??= loadJsonSchemaValidator();
  if (jsonSchemaValidator(layout)) {
    const semanticErrors = semanticallyValidateLayout(layout);
    return semanticErrors.length > 0 ? semanticErrors : layout;
  } else {
    return jsonSchemaValidator.errors!.map(
      (error) => `${error.instancePath}: ${error.message}`,
    );
  }
}

/**
 * Validates a Neo2-family layout against semantic rules that JSON Schema
 * cannot express.
 *
 * Returns human-readable error messages; an empty array means the layout is
 * semantically valid. This function is intentionally generic: it does not
 * encode any parser-specific assignments or layout-specific fixed cells.
 */
function semanticallyValidateLayout(layout: Neo2FamilyLayout): string[] {
  const errors: string[] = [];

  for (const [levelName, level] of Object.entries(layout.levels)) {
    for (const [keyCode, keyEffect] of Object.entries(level)) {
      validateKeyEffect(levelName, keyCode, keyEffect);
    }
  }

  return errors;
}

function validateKeyEffect(
  levelName: string,
  code: string,
  effect: KeyEffect,
): string[] {
  if (effect === null) return [];

  if (typeof effect === "string") {
    return validatePlainString(effect, levelName, code);
  } else if ("char" in effect) {
    return validateCharName(effect.char, levelName, code);
  } else if ("dead" in effect) {
    return validateDeadName(effect.dead, levelName, code);
  }

  // `{ key: ... }` values are intentionally not validated against a fixed
  // enum; the schema already rejects the `Neo*` prefix for plain W3C keys.
  return [];
}

function validateCharName(
  name: string,
  levelName: string,
  code: string,
): string[] {
  const char = charForUnicodeName(name);
  if (char === undefined) {
    return [
      `${levelName}.${code}: { char: ${JSON.stringify(name)} } is not an official Unicode character name`,
    ];
  }

  if (isCombiningMark(char)) {
    return [
      `${levelName}.${code}: { char: ${JSON.stringify(name)} } resolves to a combining mark`,
    ];
  }
  return [];
}

function validateDeadName(
  name: string,
  levelName: string,
  code: string,
): string[] {
  if (name.startsWith("NEO DEAD ")) {
    // Neo-specific dead-key constants are validated by the schema enum.
    return [];
  }

  if (name.startsWith("COMBINING ")) {
    const char = charForUnicodeName(name);
    if (char === undefined) {
      return [
        `${levelName}.${code}: { dead: ${JSON.stringify(name)} } is not an official Unicode combining character name`,
      ];
    }

    if (!isCombiningMark(char)) {
      return [
        `${levelName}.${code}: { dead: ${JSON.stringify(name)} } resolves to a non-combining character`,
      ];
    }
    return [];
  }

  return [
    `${levelName}.${code}: { dead: ${JSON.stringify(name)} } is not a recognized dead-key identifier`,
  ];
}

function validatePlainString(
  value: string,
  levelName: string,
  code: string,
): string[] {
  if (value.length !== 1) {
    return [
      `${levelName}.${code}: ${JSON.stringify(value)} must be exactly one Unicode character`,
    ];
  }

  const char = value[0]!;
  if (/\s/u.test(char)) {
    return [
      `${levelName}.${code}: ${JSON.stringify(value)} is a whitespace character and must use { char: "..." }`,
    ];
  }

  if (isCombiningMark(char)) {
    return [
      `${levelName}.${code}: ${JSON.stringify(value)} is a combining mark and must use { dead: "..." }`,
    ];
  }

  if (unicodeType(char) !== "Graphic") {
    return [
      `${levelName}.${code}: ${JSON.stringify(value)} is not a visible graphic character`,
    ];
  }
  return [];
}

function isCombiningMark(char: string): boolean {
  return /^\p{Mark}$/u.test(char);
}

let nameToChar: ReadonlyMap<string, string> | undefined;

function charForUnicodeName(name: string): string | undefined {
  nameToChar ??= buildUnicodeNameMap();
  return nameToChar.get(name);
}

function buildUnicodeNameMap(): ReadonlyMap<string, string> {
  const map = new Map<string, string>();

  for (let codePoint = 0; codePoint <= 0x10_ff_ff; codePoint += 1) {
    if (codePoint >= 0xd800 && codePoint <= 0xdfff) continue;

    const name = unicodeName(codePoint);
    if (name !== undefined && !name.startsWith("<")) {
      map.set(name, String.fromCodePoint(codePoint));
    }
  }

  return map;
}
