import dotenv from "dotenv"
import prompts from "prompts"

import { acceptAllRelationships } from "./acceptAllRelationships.mjs"
import { createComplexQRCode } from "./createComplexQRCode.mjs"
import { createSimpleQRCode } from "./createSimpleQRCode.mjs"

dotenv.config()

let running = true
while (running) {
  const result = await prompts({
    type: "select",
    name: "action",
    message: "What do you want to do?",
    choices: [
      { title: "Complex QR Code", value: "1" },
      { title: "Simple QR Code", value: "2" },
      { title: "Accept All Relationships", value: "3" },
      { title: "Exit", value: "4" },
    ],
  })

  if (!result.action) break

  switch (result.action) {
    case "1":
      await createComplexQRCode()
      break
    case "2":
      await createSimpleQRCode()
      break
    case "3":
      await acceptAllRelationships()
      break
    case "4":
      running = false
      break
  }
}
