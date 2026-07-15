import { KeyCode, Neo2FamilyLayout, validateLayout } from "neo-layout-model";
import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as YAML from "yaml";
import { OneOrMore } from "./KeyboardLayout.js";
import { APPLE_VIRTUAL_KEY_CODES } from "./appleKeyCodes.js";
import { fragment } from "xmlbuilder2";
import type { XMLBuilder } from "xmlbuilder2/lib/interfaces.js";
import { KeyboardLayoutBuilder } from "./KeyboardLayoutBuilder.js";
import { MacOsBundle } from "./MacOsBundle.js";

const MODELS_PATH = path.join(
  import.meta.dirname,
  "..",
  "..",
  "model",
  "generated",
);
const BUNDLE_PATH = path.join(
  import.meta.dirname,
  "..",
  "neo-layouts_v3.bundle",
);

function initBundleInfo(bundle: MacOsBundle) {
  bundle.info = {
    CFBundleIdentifier: "org.neo-layout.neo-layouts",
    CFBundleName: "Neo Layouts (v3)",
    CFBundleVersion: "3.0.0",
  };
}

function initBundleVersion(bundle: MacOsBundle) {
  bundle.version = {
    BuildVersion: "0",
    ProjectName: "Neo Layouts (v3)",
    SourceVersion: "3.0.0",
  };
}

function generateLayoutInfo(bundle: MacOsBundle, layout: Neo2FamilyLayout) {
  bundle.info[`KLInfo_${layout.displayName}`] = {
    TISInputSourceID: layout.id,
    TISIconIsTemplate: false,
    TICapsLockLanguageSwitchCapable: false,
    TISIntendedLanguage: "de",
  };
  const existingTranslations =
    bundle.resources[`de/lproj/InfoPlist.strings`]?.split("\n") ?? [];
  bundle.resources[`de/lproj/InfoPlist.strings`] = [
    ...existingTranslations,
    `"${layout.displayName}" = "${layout.displayName}";`,
  ]
    .sort((a, b) => a.localeCompare(b, "de"))
    .join("\n");
}

export function generateKeylayout(
  layout: Neo2FamilyLayout,
): KeyboardLayoutBuilder {
  // Placeholder structure that satisfies the DTD. The real Neo → keylayout
  // mapping still needs to be implemented.
  return new KeyboardLayoutBuilder(layout.id, layout.displayName).addKeyMap(
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
  const select = fragment().ele("keyMapSelect", { mapIndex: 0 });
  select.ele("modifier", { keys: "" });
  const map = fragment().ele("keyMap", { index: 0 });
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

async function forEachModel(
  action: (layout: Neo2FamilyLayout) => Promise<void>,
): Promise<string[]> {
  const modelFiles = (await fs.readdir(MODELS_PATH))
    .filter((file) => file.endsWith(".yaml"))
    .map((file) => path.join(MODELS_PATH, file));

  return (
    await Promise.all(
      modelFiles.map((filePath) =>
        (async () => {
          const parsed = YAML.parse(
            await fs.readFile(filePath, "utf-8"),
          ) as unknown;
          const validationResult = validateLayout(parsed);
          if (Array.isArray(validationResult)) {
            return validationResult.map((error) => `${filePath}: ${error}`);
          }

          // TODO avoid cast
          const layout = validationResult as Neo2FamilyLayout;
          await action(layout);
          return [];
        })(),
      ),
    )
  ).flat();
}

async function generateAll() {
  const bundle = new MacOsBundle(BUNDLE_PATH);
  initBundleInfo(bundle);
  initBundleVersion(bundle);

  const validationErrors = await forEachModel(async (layout) => {
    const appleKeylayout = generateKeylayout(layout);
    bundle.resources[`${layout.displayName}.keylayout`] =
      appleKeylayout.build();
    generateLayoutInfo(bundle, layout);
  });

  await bundle.write();
  console.log("Wrote bundle to ", bundle.dir);

  if (validationErrors.length > 0) {
    validationErrors.forEach(console.error);
    process.exit(1);
  }
}

await generateAll();
