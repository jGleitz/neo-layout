import {create} from "xmlbuilder2";
import type {XMLBuilder} from "xmlbuilder2/lib/interfaces.js";

const MODIFIER_MAP_ID = "mainModifierMap";
const KEY_MAP_SET_ID = "mainKeyMapSet";

export class KeyboardLayoutBuilder {
  private readonly document = create({ version: "1.0", encoding: "UTF-8" });
  private readonly modifierMap: XMLBuilder;
  private readonly keyMapSet: XMLBuilder;

  constructor(name: string) {
    this.document.dtd({
      name: "keyboard",
      sysID: "file://localhost/System/Library/DTDs/KeyboardLayout.dtd",
    });
    const keyboard = this.document.ele("keyboard", {
      group: "126", // value taken from pre-existing layout. TODO understand
      id: "-68987", // random value. TODO understand
      name,
    });
    keyboard.ele("layouts").ele("layout", {
      first: "0", // TODO,
      last: "0", // TODO,
      modifiers: MODIFIER_MAP_ID,
      mapSet: KEY_MAP_SET_ID,
    });
    this.modifierMap = keyboard.ele("modifierMap", {
      id: MODIFIER_MAP_ID,
      defaultIndex: "1",
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
