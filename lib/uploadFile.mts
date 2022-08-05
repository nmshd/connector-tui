import { readFile } from "fs/promises"
import { DateTime } from "luxon"
import path from "path"
import { createQRCodeForFile } from "./createQRCode.mjs"
import { CONNECTOR_CLIENT } from "./globals.mjs"

const filePath = path.resolve("__assets__/upload.txt")

export async function uploadFile() {
  const file = await CONNECTOR_CLIENT.files.uploadOwnFile({
    title: "aFile",
    expiresAt: DateTime.utc().plus({ days: 1 }).toISO(),
    file: await readFile(filePath),
    filename: "upload.txt",
  })

  await createQRCodeForFile(file.result)
}
