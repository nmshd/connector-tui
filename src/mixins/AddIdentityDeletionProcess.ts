import chalk from "chalk"
import { DateTime } from "luxon"
import prompts from "prompts"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase.js"

export function AddIdentityDeletionProcess<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class IdentityDeletionProcess extends Base {
    public constructor(...args: any[]) {
      super(...args)
      if (this.isDebugMode()) {
        const identityDeletionProcessChoices = { title: "IdentityDeletionProcess", value: this.identityDeletionProcess }

        this.choices.push(identityDeletionProcessChoices)

        this.choicesInDeletion.push(identityDeletionProcessChoices)
      }
    }

    protected async identityDeletionProcess() {
      const choices = []

      const identityDeletionProcess = await this.getIdentityDeletionProcesses()

      if (identityDeletionProcess.status === 200) {
        choices.push({ title: "Show IdentityDeletionProcess", value: "Show" })

        if (identityDeletionProcess.data.result.status === "Approved") {
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
          this.showIdentityDeletionProcesses(identityDeletionProcess.data)
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
      const query = confirmation["IdentityDeletionProcess grace period"] ? `?lengthOfGracePeriodInDays=${oneSecondInDays}` : ""
      const identityDeletionProcess = (await this.plainHttpClient.post(`/api/v2/IdentityDeletionProcess${query}`)).data

      console.log("Identity Deletion Process initiated.")

      this.showIdentityDeletionProcesses(identityDeletionProcess)
    }

    protected async cancelIdentityDeletionProcess() {
      const identityDeletionProcess = (await this.plainHttpClient.delete("/api/v2/IdentityDeletionProcess")).data
      console.log("Identity Deletion Process canceled.")

      this.showIdentityDeletionProcesses(identityDeletionProcess)
    }
    protected showIdentityDeletionProcesses(identityDeletionProcess: any) {
      console.log(`Identity deletion status: ${chalk.yellow(identityDeletionProcess.result.status)}`)

      if (identityDeletionProcess.result.status === "Approved") {
        console.log(`End of grace period: ${chalk.yellow(DateTime.fromISO(identityDeletionProcess.result.gracePeriodEndsAt).toLocaleString())}`)
      }
    }
  }
}
