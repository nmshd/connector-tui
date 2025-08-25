import chalk from "chalk"
import { DateTime } from "luxon"
import prompts from "prompts"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase.js"
import { IdentityDeletionProcess } from "../client/IdentityDeletionProcessEndpoint.js"

export function AddIdentityDeletionProcess<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class IdentityDeletionProcessHandler extends Base {
    public constructor(...args: any[]) {
      super(...args)
      if (!this.isDebugMode()) return

      const identityDeletionProcessChoices = { title: "IdentityDeletionProcess", value: this.identityDeletionProcess }

      this.choices.push(identityDeletionProcessChoices)
      this.choicesInDeletion.push(identityDeletionProcessChoices)
    }

    protected async identityDeletionProcess() {
      const choices = []

      const activeIdentityDeletionProcess = await this.connectorClient.identityDeletionProcess.getActiveIdentityDeletionProcess()

      if (activeIdentityDeletionProcess.isSuccess) {
        choices.push({ title: "Show IdentityDeletionProcess", value: "Show" })

        if (activeIdentityDeletionProcess.result.status === "Approved") {
          choices.push({ title: "Cancel IdentityDeletionProcess", value: "Cancel" })
        }
      } else {
        choices.push({ title: "Init IdentityDeletionProcess", value: "Init" })
      }

      const result = await prompts({
        message: "Identity Deletion Process",
        type: "select",
        name: "Identity Deletion Process",
        choices,
      })

      switch (result["Identity Deletion Process"]) {
        case "Show":
          this.showIdentityDeletionProcesses(activeIdentityDeletionProcess.result)
          break
        case "Init":
          await this.initIdentityDeletionProcess()
          break
        case "Cancel":
          await this.cancelIdentityDeletionProcess()
          break
      }
    }

    protected async initIdentityDeletionProcess() {
      const confirmation = await prompts({
        message: "Do you want to delete the identity immediately (Grace period will be one second)?",
        type: "confirm",
        name: "IdentityDeletionProcess grace period",
      })

      const oneSecondInDays = 1 / (24 * 60 * 60)
      const lengthOfGracePeriodInDays = confirmation["IdentityDeletionProcess grace period"] ? oneSecondInDays : undefined
      const identityDeletionProcess = (await this.connectorClient.identityDeletionProcess.initiateIdentityDeletionProcess(lengthOfGracePeriodInDays)).result

      console.log("Identity Deletion Process initiated.")

      this.showIdentityDeletionProcesses(identityDeletionProcess)
    }

    protected async cancelIdentityDeletionProcess() {
      const identityDeletionProcess = (await this.connectorClient.identityDeletionProcess.cancelIdentityDeletionProcess()).result
      console.log("Identity Deletion Process canceled.")

      this.showIdentityDeletionProcesses(identityDeletionProcess)
    }

    protected showIdentityDeletionProcesses(identityDeletionProcess: IdentityDeletionProcess) {
      console.log(`Identity deletion status: ${chalk.yellow(identityDeletionProcess.status)}`)

      if (identityDeletionProcess.status === "Approved") {
        console.log(`End of grace period: ${chalk.yellow(DateTime.fromISO(identityDeletionProcess.gracePeriodEndsAt!).toLocaleString())}`)
      }
    }
  }
}
