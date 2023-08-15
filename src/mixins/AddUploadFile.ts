import fs from "fs"
import { DateTime } from "luxon"
import path from "path"
import prompts from "prompts"
import qrcode from "qrcode-terminal"
import url from "url"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase"

export function AddUploadFile<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class Sync extends Base {
    private readonly assetFolder = path.resolve(url.fileURLToPath(new URL(".", import.meta.url)), "../../__assets__")

    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Upload File", value: this.uploadFile })
    }

    protected async uploadFile() {
      const filenames = await fs.promises.readdir(this.assetFolder)

      const result = await prompts([
        {
          message: "Which file do you want to upload?",
          type: "select",
          name: "filename",
          choices: filenames.map((filename) => ({ title: filename, value: filename })),
        },
        {
          message: "Whats the files title?",
          type: "text",
          name: "title",
          initial: "aFile",
        },
        {
          message: "Whats the files description?",
          type: "text",
          name: "description",
          initial: "A file.",
        },
      ])

      const title = result.title

      const expiresAt = DateTime.local().plus({ days: 1 }).toISO()!
      const filename = result.filename
      const description = result.description

      if (!title || !filename) return console.log("No file / title selected")

      const file = await fs.promises.readFile(path.resolve(this.assetFolder, filename))

      const uploadedFile = await this.connectorClient.files.uploadOwnFile({ title, expiresAt, file, filename, description })

      const render = await prompts({
        name: "yesno",
        message: "Do you want to render a QR Code for this file?",
        type: "confirm",
        initial: true,
      })

      if (render.yesno) {
        const url = `nmshd://tr#${uploadedFile.result.truncatedReference}`
        console.log(url)
        qrcode.generate(url, { small: true })
      }
    }
  }
}
