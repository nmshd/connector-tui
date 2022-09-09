import { ConnectorClient } from "@nmshd/connector-sdk"
import chalk from "chalk"
import { readFile } from "fs/promises"
import prompts from "prompts"
import { ConnectorTUIBaseWithMixins } from "./mixins"

export class ConnectorTUI extends ConnectorTUIBaseWithMixins {
  public static async create(baseUrl: string, apiKey: string) {
    const client = ConnectorClient.create({ baseUrl, apiKey })
    const address = (await client.account.getIdentityInfo()).result.address

    return new ConnectorTUI(client, address)
  }

  public async run() {
    await this.showStartupMessage()

    while (true) {
      const result = await prompts({
        type: "select",
        name: "action",
        message: "What do you want to do?",
        choices: this.choices,
      })

      if (!result.action) break

      if (typeof result.action === "function") {
        try {
          await result.action.apply(this)
        } catch (error) {
          console.log(chalk.red("An Error occurred: "), error)
        }
      } else {
        break
      }
    }
  }

  private async showStartupMessage() {
    const connectorVersionInfo = await this.connectorClient.monitoring.getVersion()
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
  }
}
