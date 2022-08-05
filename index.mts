import dotenv from "dotenv"
import prompts from "prompts"

import { acceptAllRelationships, createComplexQRCode, createSimpleQRCode, uploadFile } from "./lib/index.mjs"

dotenv.config()

let running = true
while (running) {
  const result = await prompts({
    type: "select",
    name: "action",
    message: "What do you want to do?",
    choices: [
      { title: "Complex QR Code", value: 1 },
      { title: "Simple QR Code", value: 2 },
      { title: "Accept All Relationships", value: 3 },
      { title: "Upload File", value: 4 },
      { title: "Exit", value: "exit" },
    ],
  })

  if (!result.action) break

  switch (result.action) {
    case 1:
      await createComplexQRCode()
      break
    case 2:
      await createSimpleQRCode()
      break
    case 3:
      await acceptAllRelationships()
      break
    case 4:
      await uploadFile()
      break
    case "exit":
    default:
      running = false
      break
  }
}
