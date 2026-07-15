import fs from "node:fs/promises";
import path from "node:path";

export class MacOsBundle {
  constructor(private dir: string) {}

  async write() {
    await fs.mkdir(path.join(this.dir, "Contents", "Resources"), {
      recursive: true,
    });
    await Promise.all([
      fs.writeFile(
        path.join(this.dir, "Contents", "Info.plist"),
        generateInfoPlist(),
      ),
      fs.writeFile(
        path.join(this.dir, "Contents", "version.plist"),
        generateVersionPlist(),
      ),
    ]);
  }
}
