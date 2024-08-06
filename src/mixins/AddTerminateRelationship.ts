import { ConnectorRelationshipStatus } from "@nmshd/connector-sdk"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase.js"

export function AddTerminateRelationship<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class TerminateRelationship extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Terminate Relationship", value: this.terminateRelationship })
    }

    protected async terminateRelationship() {
      await this.connectorClient.account.sync()

      const relationship = await this.selectRelationship("Select relationship to terminate", ConnectorRelationshipStatus.Active)
      if (!relationship) return

      console.log(`Terminating relationship ${relationship.id}`)
      const terminationResult = await this.connectorClient.relationships.terminateRelationship(relationship.id)
      if (terminationResult.isError) {
        console.error(`Failed to terminate relationship ${relationship.id}: ${JSON.stringify(terminationResult.error)}`)
        return
      }
    }
  }
}
