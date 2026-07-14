#!/usr/bin/env node
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as YAML from "yaml";
import { parseNeoReference } from "./parseNeoReference.js";
import { schemaPath, validateLayout } from "./validateLayout.js";
import type { Neo2FamilyLayout } from "./generated/layout.js";

const REFERENCE_DIR = "../A-REFERENZ-A";
const OUTPUT_DIR = "generated";

const SOURCES: ReadonlyArray<
  {
    file: string;
  } & Pick<Neo2FamilyLayout, "id" | "displayName" | "description">
> = [
  {
    file: "neo20.txt",
    id: "org.neo-layout.neo-layouts.de.neo2",
    displayName: "Deutsch (Neo 2 v3)",
    description: "Neo2 standard layout",
  },
  {
    file: "neoqwertz.txt",
    id: "org.neo-layout.neo-layouts.de.neoqwertz",
    displayName: "Deutsch (Neo-QWERTZ v3)",
    description: "Neo-QWERTZ layout",
  },
  {
    file: "bone.txt",
    id: "org.neo-layout.neo-layouts.de.bone",
    displayName: "Deutsch (Bone v3)",
    description: "Bone layout",
  },
];

async function main(): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  let allValid = true;

  for (const source of SOURCES) {
    const inputPath = path.join(REFERENCE_DIR, source.file);
    const sourceText = await fs.readFile(inputPath, "utf-8");

    const layout = {
      $schema: path.relative(OUTPUT_DIR, schemaPath),
      id: source.id,
      displayName: source.displayName,
      description: source.description,
      levels: parseNeoReference(sourceText),
    };

    allValid &&= validateLayoutAndOutputErrors(layout, source.displayName);

    const outputPath = path.join(OUTPUT_DIR, `${source.displayName}.yaml`);
    const yamlText = YAML.stringify(layout, {
      defaultKeyType: "PLAIN",
      aliasDuplicateObjects: false,
    });
    await fs.writeFile(outputPath, yamlText, "utf-8");
    console.log(`Wrote ${outputPath}`);
  }

  if (allValid) {
    console.log("All generated layouts validated successfully.");
  } else {
    process.exit(1);
  }
}

function validateLayoutAndOutputErrors(
  data: Neo2FamilyLayout,
  name: string,
): boolean {
  const errors = validateLayout(data);
  if (Array.isArray(errors) && errors.length > 0) {
    console.error(`Validation failed for ${name}:`);
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    return false;
  }

  return true;
}

await main();
