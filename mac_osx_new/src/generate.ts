import { KeyCode, Neo2FamilyLayout, validateLayout } from "neo-layout-model";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as YAML from "yaml";
import { OneOrMore } from "./KeyboardLayout.js";
import { APPLE_VIRTUAL_KEY_CODES } from "./appleKeyCodes.js";
import { create, fragment } from "xmlbuilder2";
import type { XMLBuilder } from "xmlbuilder2/lib/interfaces.js";
import { KeyboardLayoutBuilder } from "./KeyboardLayoutBuilder.js";

const MODELS_PATH = path.join(
  import.meta.dirname,
  "..",
  "..",
  "model",
  "generated",
);
const BUNDLE_PATH = path.join(import.meta.dirname, "..", "neo-layouts_v3.bundle");

async function generateBundleStructure() {
  await fs.mkdir(path.join(BUNDLE_PATH, "Contents", "Resources"), {
    recursive: true,
  });
  await Promise.all([
    fs.writeFile(path.join(BUNDLE_PATH, "Info.plist"), generateInfoPlist()),
    fs.writeFile(
      path.join(BUNDLE_PATH, "version.plist"),
      generateVersionPlist(),
    ),
  ]);
}

function generateInfoPlist() {
  const plist = createPlist()
    .ele("dict", {})
    .ele("key")
    .txt("CFBundleIdentifier")
    .up()
    .ele("string")
    .txt("org.neo-layout.neo-layouts")
    .up()
    .ele("key")
    .txt("CFBundleName")
    .up()
    .ele("string")
    .txt("Neo Layouts (v3)")
    .up()
    .ele("key")
    .txt("CFBundleVersion")
    .up()
    .ele("string")
    .txt("3.0.0")
    .up();

  generatePlistParams(
    plist,
    "Deutsch (Neo 2 v3)",
    "org.neo-layout.neo-layouts.de.neo2",
  );

  return plist.end({
    prettyPrint: true,
  });
}

function createPlist(): XMLBuilder {
  return create({ version: "1.0", encoding: "UTF-8" })
    .dtd({
      name: "plist",
      pubID: "-//Apple//DTD PLIST 1.0//EN",
    })
    .dtd()
    .ele("plist", {
      version: "1.0",
    });
}

function generatePlistParams(
  plist: XMLBuilder,
  layoutName: string,
  layoutId: string,
) {
  plist
    .ele("key")
    .txt(`KLInfo_${layoutName}`)
    .up()
    .ele("dict")
    .ele("key")
    .txt("TISInputSourceID")
    .up()
    .ele("string")
    .txt(layoutId)
    .up()
    .ele("key")
    .txt("TISIntendedLanguage")
    .up()
    .ele("string")
    .txt("de")
    .up()
    .ele("key")
    .txt("TICapsLockLanguageSwitchCapable")
    .up()
    .ele("false")
    .up()
    .ele("key")
    .txt("TISIconIsTemplate")
    .up()
    .ele("false")
    .up();
}

function generateVersionPlist(): string {
  return createPlist()
    .ele("dict")
    .ele("key")
    .txt("BuildVersion")
    .up()
    .ele("string")
    .txt("0")
    .up()
    .ele("key")
    .txt("ProjectName")
    .ele("string")
    .txt("Neo Layouts (v3)")
    .up()
    .ele("key")
    .txt("SourceVersion")
    .up()
    .ele("string")
    .txt("3.0.0")
    .up()
    .end({ prettyPrint: true });
}

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
  await fs.mkdir(BUNDLE_PATH, { recursive: true });
  let errors = [];

  const modelFiles = (await fs.readdir(MODELS_PATH))
    .filter((file) => file.endsWith(".yaml"))
    .map((file) => path.join(MODELS_PATH, file));

  await fs.rm(path.join(BUNDLE_PATH), { recursive: true });
  await generateBundleStructure();

  for (const filePath of modelFiles) {
    const parsed = YAML.parse(await fs.readFile(filePath, "utf-8")) as unknown;
    const validationResult = validateLayout(parsed);
    if (Array.isArray(validationResult)) {
      errors.push(...validationResult.map((error) => `${filePath}: ${error}`));
      continue;
    }
    const layout = validationResult;

    const keylayout = generateKeylayout(layout);
    const outputPath = path.join(
      BUNDLE_PATH,
      "Contents",
      "Resources",
      `${layout.name}.keylayout`,
    );
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
