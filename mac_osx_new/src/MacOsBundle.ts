import fs from "node:fs/promises"
import path from "node:path"
import { PlistContent, PlistFile } from "./PlistFile.js"

export class MacOsBundle {
  info: PlistContent & {
    [keyboardLayoutInfo: `KLInfo_${string}`]: {
      TICapsLockLanguageSwitchCapable: boolean
      TISIconIsTemplate: boolean
      TISInputSourceID: string
      TISIntendedLanguage: string
    }
  } = {}
  version: PlistContent = {}
  readonly resources: { [fileName: string]: string } = {}

  constructor(readonly dir: string) {}

  async write() {
    await fs.rm(path.join(this.dir), { recursive: true, force: true })
    await fs.mkdir(path.join(this.dir, "Contents", "Resources"), {
      recursive: true,
    })
    await Promise.all([
      fs.writeFile(
        path.join(this.dir, "Contents", "Info.plist"),
        new PlistFile(this.info).contentString(),
      ),
      fs.writeFile(
        path.join(this.dir, "Contents", "version.plist"),
        new PlistFile(this.version).contentString(),
      ),
      ...Object.entries(this.resources).map(([fileName, content]) =>
        (async () => {
          const filePath = path.join(
            this.dir,
            "Contents",
            "Resources",
            fileName,
          )
          await fs.mkdir(path.dirname(filePath), { recursive: true })
          await fs.writeFile(filePath, content)
        })(),
      ),
    ])
  }
}
