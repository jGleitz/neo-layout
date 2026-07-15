import { create } from "xmlbuilder2";
import type { XMLBuilder } from "xmlbuilder2/lib/interfaces.js";
import { createHash } from "node:crypto";

const MODIFIER_MAP_ID = "mainModifierMap";
const KEY_MAP_SET_ID = "mainKeyMapSet";

export class KeyboardLayoutBuilder {
  private readonly document = create({ version: "1.0", encoding: "UTF-8" });
  private readonly modifierMap: XMLBuilder;
  private readonly keyMapSet: XMLBuilder;

  constructor(id: string, displayName: string) {
    this.document.dtd({
      name: "keyboard",
      sysID: "file://localhost/System/Library/DTDs/KeyboardLayout.dtd",
    });
    const keyboard = this.document.ele("keyboard", {
      group: "126", // value taken from pre-existing layout. TODO understand
      id: -Math.abs(createHash("sha256").update(id).digest().readInt16BE()), // TODO understand
      name: displayName,
    });
    keyboard.ele("layouts").ele("layout", {
      first: "0", // TODO,
      last: "0", // TODO,
      modifiers: MODIFIER_MAP_ID,
      mapSet: KEY_MAP_SET_ID,
    });
    this.modifierMap = keyboard.ele("modifierMap", {
      id: MODIFIER_MAP_ID,
      defaultIndex: 0,
    });
    this.keyMapSet = keyboard.ele("keyMapSet", { id: KEY_MAP_SET_ID });
  }

  public addKeyMap(keyMapSelect: XMLBuilder, keyMap: XMLBuilder): this {
    this.modifierMap.import(keyMapSelect);
    this.keyMapSet.import(keyMap);
    return this;
  }

  public build(): string {
    return this.document.end({ prettyPrint: true });
  }
}
