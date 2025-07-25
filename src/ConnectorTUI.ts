import { ApiKeyAuthenticator, ConnectorClient } from "@nmshd/connector-sdk"
import { ConnectorVersionInfo } from "@nmshd/connector-sdk/dist/types/monitoring"
import chalk from "chalk"
import { readFile } from "fs/promises"
import { DateTime } from "luxon"
import prompts from "prompts"
import type { ConnectorTUI as ConnectorTUIInterface } from "./index.d.js"
import { ConnectorTUIBaseWithMixins } from "./mixins/index.js"

export class ConnectorTUI extends ConnectorTUIBaseWithMixins implements ConnectorTUIInterface {
  public static async create(baseUrl: string, apiKey: string) {
    const client = ConnectorClient.create({ baseUrl, authenticator: new ApiKeyAuthenticator(apiKey) })
    const address = (await client.account.getIdentityInfo()).result.address
    const support = await client.monitoring.getSupport()

    return new ConnectorTUI(client, address, support)
  }

  public async run() {
    const connectorVersionInfo = await this.#checkConnectorVersion()
    if (!connectorVersionInfo) return

    await this.#showStartupMessage(connectorVersionInfo)

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const activeIdentityDeletionProcess = this.isDebugMode() ? await this.identityDeletionProcessEndpoint.getActiveIdentityDeletionProcess() : undefined

      if (activeIdentityDeletionProcess?.isSuccess && activeIdentityDeletionProcess.result.status === "Approved") {
        const gracePeriodEndsAtDateTime = DateTime.fromISO(activeIdentityDeletionProcess.result.gracePeriodEndsAt!)

        if (gracePeriodEndsAtDateTime.diffNow().milliseconds < 0) {
          console.log(chalk.red("Grace period has ended. Identity is deleted."))
          process.exit(0)
        }
      }

      const result = await prompts({
        type: "select",
        name: "action",
        message: "What do you want to do?",
        choices: activeIdentityDeletionProcess?.isSuccess ? this.choicesInDeletion : this.choices,
      })

      if (!result.action) break

      try {
        await result.action.apply(this)
      } catch (error) {
        console.log(chalk.red("An Error occurred: "), error)
      }
    }
  }

  async #checkConnectorVersion() {
    const connectorVersionInfo = await this.connectorClient.monitoring.getVersion()

    // allow connector in debugging mode to be used
    if (connectorVersionInfo.version === "{{version}}") return connectorVersionInfo

    if (!connectorVersionInfo.version.startsWith("7.")) {
      console.log(`This TUI is made for enmeshed V7 connectors (starting with version 7.0.0 of the connector). Current version: ${connectorVersionInfo.version}`)

      return
    }

    return connectorVersionInfo
  }

  async #showStartupMessage(connectorVersionInfo: ConnectorVersionInfo) {
    const jsonString = (await readFile(new URL("../package.json", import.meta.url))).toString()
    const packageJson = JSON.parse(jsonString)

    const baseUrl = (this.support.configuration.transportLibrary as any)?.baseUrl

    console.log(`Welcome to the ${chalk.blue("enmeshed V2 TUI")}!`)
    console.log(`TUI Version: ${chalk.yellow(packageJson.version)}`)
    console.log(`Connector version: ${chalk.yellow(connectorVersionInfo.version)}`)
    console.log(`Connector Address: ${chalk.yellow(this.connectorAddress)}`)
    console.log(`Connector Backbone BaseURL: ${chalk.yellow(baseUrl)}`)
    console.log("")
  }
}
