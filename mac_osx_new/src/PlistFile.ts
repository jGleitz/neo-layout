export class PlistFile {
  constructor(private readonly content: PlistContent) {}


}

type PlistContent = PlistObject | string | boolean
type PlistObject = {[key: string]: PlistContent}