import fs from "fs"
import { DateTime } from "luxon"
import path from "path"
import { createQRCodeForFile } from "./createQRCode.js"
import { CONNECTOR_CLIENT } from "./globals.js"

import prompts from "prompts"
const assetFolder = path.resolve("__assets__")

export async function uploadFile() {
  const filenames = await fs.promises.readdir(assetFolder)

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
  ])

  const title = result.title
  const expiresAt = DateTime.local().plus({ days: 1 }).toISO()
  const filename = result.filename
  const file = await fs.promises.readFile(path.resolve(assetFolder, filename))

  const uploadedFile = await CONNECTOR_CLIENT.files.uploadOwnFile({ title, expiresAt, file, filename })

  const render = await prompts({
    name: "yesno",
    message: "Do you want to render a QR Code for this file?",
    type: "confirm",
    initial: true,
  })

  if (render.yesno) {
    await createQRCodeForFile(uploadedFile.result)
  }
}
