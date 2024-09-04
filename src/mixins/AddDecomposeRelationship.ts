import { ConnectorRelationshipStatus } from "@nmshd/connector-sdk"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase.js"

export function AddDecomposeRelationship<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class DecomposeRelationship extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Decompose Relationship", value: this.decomposeRelationship })
    }

    protected async decomposeRelationship() {
      await this.connectorClient.account.sync()

      const relationship = await this.selectRelationship("Select relationship to decompose", ConnectorRelationshipStatus.Terminated, ConnectorRelationshipStatus.DeletionProposed)
      if (!relationship) return

      console.log(`Decomposing relationship ${relationship.id}`)
      const decomposeResult = await this.connectorClient.relationships.decomposeRelationship(relationship.id)
      if (decomposeResult.isError) {
        console.error(`Failed to decompose relationship ${relationship.id}: ${JSON.stringify(decomposeResult.error)}`)
        return
      }
    }
  }
}
