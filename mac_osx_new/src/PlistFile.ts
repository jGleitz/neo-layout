import { create } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces.js";

export class PlistFile {
  constructor(private readonly content: PlistContent) {}

  public contentString() {
    const xml = create({ version: "1.0", encoding: "UTF-8" })
      .dtd({
        name: "plist",
        pubID: "-//Apple//DTD PLIST 1.0//EN",
        sysID: "http://www.apple.com/DTDs/PropertyList-1.0.dtd",
      })
      .ele("plist", {
        version: "1.0",
      });
    this.writeProperty(xml, this.content);
    return xml.end({ prettyPrint: true });
  }

  private writeProperty(xml: XMLBuilder, property: PlistContent) {
    if (typeof property === "string") {
      this.writeString(xml, property);
    } else if (typeof property === "boolean") {
      this.writeBoolean(xml, property);
    } else if (typeof property === "object") {
      this.writeDict(xml, property);
    } else {
      throw new TypeError(
        `Unsupported property type: ${typeof property} ${property}`,
      );
    }
  }

  private writeDict(xml: XMLBuilder, obj: PlistObject) {
    const dict = xml.ele("dict");
    for (const [key, value] of Object.entries(obj)) {
      dict.ele("key").txt(key);
      this.writeProperty(dict, value);
    }
  }

  private writeString(xml: XMLBuilder, value: string) {
    xml.ele("string").txt(value);
  }

  private writeBoolean(xml: XMLBuilder, value: boolean) {
    xml.ele(value ? "true" : "false");
  }
}

export type PlistContent = PlistObject | string | boolean;
export type PlistObject = { [key: string]: PlistContent };
