import chalk from "chalk"
import prompts from "prompts"

import {
  acceptAllRelationships,
  CONNECTOR_CLIENT,
  createComplexQRCode,
  createSimpleQRCode,
  sendMessage,
  uploadFile,
} from "./lib"

const connectorVersionInfo = await CONNECTOR_CLIENT.monitoring.getVersion()
if (!connectorVersionInfo.version.startsWith("3.")) {
  console.log(
    `This TUI is made for Enmeshed V2 connectors (starting with version 3.0.0 of the connector). Current version: ${connectorVersionInfo.version}`
  )
  process.exit(1)
}

console.log(`Welcome to the ${chalk.blue("Enmeshed V2 TUI")}!`)
console.log(`TUI Version: ${chalk.yellow(process.env.npm_package_version)}`)
console.log(`Connector version: ${chalk.yellow(connectorVersionInfo.version)}`)
console.log("")

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
      { title: "Send Message", value: 5 },
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
    case 5:
      await sendMessage()
      break
    case "exit":
    default:
      running = false
      break
  }
}
