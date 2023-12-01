import chalk from "chalk"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase.js"

export function AddConnectorInfo<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class ConnectorInfo extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Connector Info", value: this.connectorInfo })
    }

    protected async connectorInfo() {
      const connectorInfo = await this.connectorClient.monitoring.getSupport()

      const transportLibrary = connectorInfo.configuration["transportLibrary"] as { baseUrl: string; platformClientId: string }
      const moduleConfig = connectorInfo.configuration.modules as Record<string, { enabled: boolean; displayName: string }>

      const enabledModules = Object.values(moduleConfig)
        .filter((module) => module.enabled)
        .map((module) => module.displayName)
        .sort()
        .join(", ")

      console.log(`Health: ${connectorInfo.health.isHealthy ? chalk.green("Healthy") : chalk.red("Unhealthy")}
Backbone
  BaseUrl: ${chalk.yellow(transportLibrary.baseUrl)}
  ClientId: ${chalk.yellow(transportLibrary.platformClientId)}
Identity Info
  Address: ${chalk.yellow(connectorInfo.identityInfo.address)}
  Public Key: ${chalk.yellow(connectorInfo.identityInfo.publicKey)}
Enabled Modules: ${chalk.yellow(enabledModules)}
      `)
    }
  }
}
