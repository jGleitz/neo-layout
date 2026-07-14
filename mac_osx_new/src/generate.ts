import {KeyCode, Neo2FamilyLayout, validateLayout} from "neo-layout-model";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as YAML from "yaml";
import {OneOrMore,} from "./KeyboardLayout.js";
import {APPLE_VIRTUAL_KEY_CODES} from "./appleKeyCodes.js";
import {fragment} from "xmlbuilder2";
import type {XMLBuilder} from "xmlbuilder2/lib/interfaces.js";
import {KeyboardLayoutBuilder} from "./KeyboardLayoutBuilder.js";

const MODELS_PATH = path.join(
  import.meta.dirname,
  "..",
  "..",
  "model",
  "generated",
);
const OUTPUT_DIR = path.join(import.meta.dirname, "..", "layouts");

export function generateKeylayout(
  layout: Neo2FamilyLayout,
): KeyboardLayoutBuilder {
  // Placeholder structure that satisfies the DTD. The real Neo → keylayout
  // mapping still needs to be implemented.
  return new KeyboardLayoutBuilder(layout.name).addKeyMap(
    ...generateLevel1(layout),
  );
}

function atLeastOne<T>(values: readonly T[]): OneOrMore<T> {
  if (values.length < 1) {
    throw new Error("Expected at least one value!");
  }
  return values as OneOrMore<T>;
}

function generateLevel1(layout: Neo2FamilyLayout): [XMLBuilder, XMLBuilder] {
  const select = fragment().ele("keyMapSelect", { mapIndex: "1" });
  select.ele("modifier", { keys: "" });
  const map = fragment().ele("keyMap", { index: "1" });
  for (const [code, effect] of Object.entries(layout.levels.level1)) {
    let appleEffect!: string;
    if (typeof effect === "string") {
      appleEffect = effect;
    } else if (effect === null || typeof effect !== "object") {
      continue;
    } else if ("dead" in effect) {
      // TODO support
      continue;
    } else if ("key" in effect) {
        // TODO support
        continue;
    } else if ("char" in effect) {
        // TODO support
        continue;
    }
    map.com(`${code} → ${JSON.stringify(effect)}`).ele("key", {
      // TODO handle absent mapping
      code: `${APPLE_VIRTUAL_KEY_CODES[code as KeyCode]}`,
      output: appleEffect,
    });
  }
  return [select, map];
}

async function generateAll() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  let errors = [];

  const modelFiles = (await fs.readdir(MODELS_PATH))
    .filter((file) => file.endsWith(".yaml"))
    .map((file) => path.join(MODELS_PATH, file));
  for (const filePath of modelFiles) {
    const parsed = YAML.parse(await fs.readFile(filePath, "utf-8")) as unknown;
    const validationResult = validateLayout(parsed);
    if (Array.isArray(validationResult)) {
      errors.push(...validationResult.map((error) => `${filePath}: ${error}`));
      continue;
    }
    const layout = validationResult;

    const keylayout = generateKeylayout(layout);
    const outputPath = path.join(OUTPUT_DIR, `${layout.name}.keylayout`);
    await fs.writeFile(outputPath, keylayout.build(), "utf-8");

    console.log(
      path.relative(process.cwd(), filePath) +
        " -> " +
        path.relative(process.cwd(), outputPath),
    );
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(error);
    }
    process.exit(1);
  }
}

await generateAll();
