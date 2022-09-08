import chalk from "chalk"
import { readFile } from "fs/promises"
import prompts from "prompts"

import {
  acceptPendingRelationships,
  CONNECTOR_CLIENT,
  getAttributesOfContact,
  sendMail,
  sendRequestByMessage,
  shareRequestByTemplate,
  sync,
  uploadFile,
} from "./functionality"

const connectorVersionInfo = await CONNECTOR_CLIENT.monitoring.getVersion()
if (!connectorVersionInfo.version.startsWith("3.")) {
  console.log(
    `This TUI is made for Enmeshed V2 connectors (starting with version 3.0.0 of the connector). Current version: ${connectorVersionInfo.version}`
  )
  process.exit(1)
}

const jsonString = (await readFile(new URL("../package.json", import.meta.url))).toString()
const packageJson = JSON.parse(jsonString)

console.log(`Welcome to the ${chalk.blue("Enmeshed V2 TUI")}!`)
console.log(`TUI Version: ${chalk.yellow(packageJson.version)}`)
console.log(`Connector version: ${chalk.yellow(connectorVersionInfo.version)}`)
console.log("")

while (true) {
  const result = await prompts({
    type: "select",
    name: "action",
    message: "What do you want to do?",
    choices: [
      { title: "Sync", value: sync },
      { title: "Accept Pending Relationships", value: acceptPendingRelationships },
      { title: "Upload File", value: uploadFile },
      { title: "Send Mail", value: sendMail },
      { title: "Send Request By Message", value: sendRequestByMessage },
      { title: "Share Request By Template", value: shareRequestByTemplate },
      { title: "Get Attributes of Contact", value: getAttributesOfContact },
      { title: "Exit", value: "exit" },
    ],
  })

  if (!result.action) break

  if (typeof result.action === "function") {
    try {
      await result.action()
    } catch (error) {
      console.log(chalk.red("An Error occurred: "), error)
    }
  } else {
    break
  }
}