import { ConnectorRelationshipStatus } from "@nmshd/connector-sdk"
import prompts from "prompts"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase"

export function AddAcceptPendingRelationships<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class Sync extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Accept Pending Relationships", value: this.acceptPendingRelationships })
    }

    protected async acceptPendingRelationships() {
      const result = await prompts({
        message: "Do you want to sync before accepting pending relationships?",
        type: "confirm",
        name: "sync",
      })

      if (result.sync) {
        await this.connectorClient.account.sync()
      }

      const pendingRelationships = (
        await this.connectorClient.relationships.getRelationships({
          status: ConnectorRelationshipStatus.PENDING,
        })
      ).result

      for (const relationship of pendingRelationships) {
        console.log(`Accepting relationship ${relationship.id}`)
        await this.connectorClient.relationships.acceptRelationshipChange(relationship.id, relationship.changes[0].id)
      }
    }
  }
}
