import { ConnectorRelationshipStatus } from "@nmshd/connector-sdk"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase.js"

export function AddTerminateAndDecomposeRelationship<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class TerminateAndDecomposeRelationship extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Terminate and Decompose Relationship", value: this.terminateAndDecomposeRelationship })
    }

    protected async terminateAndDecomposeRelationship() {
      await this.connectorClient.account.sync()

      const relationship = await this.selectRelationship(
        "Select relationship to terminate and decompose",
        ConnectorRelationshipStatus.Active,
        ConnectorRelationshipStatus.Terminated,
        ConnectorRelationshipStatus.DeletionProposed
      )
      if (!relationship) return

      console.log(relationship.status)

      if (relationship.status === ConnectorRelationshipStatus.Active) {
        console.log(`Terminating relationship ${relationship.id}`)
        const terminationResult = await this.connectorClient.relationships.terminateRelationship(relationship.id)
        if (terminationResult.isError) {
          console.error(`Failed to terminate relationship ${relationship.id}: ${JSON.stringify(terminationResult.error)}`)
          return
        }
      }

      console.log(`Decomposing relationship ${relationship.id}`)
      const decomposeResult = await this.connectorClient.relationships.decomposeRelationship(relationship.id)
      if (decomposeResult.isError) {
        console.error(`Failed to terminate relationship ${relationship.id}: ${JSON.stringify(decomposeResult.error)}`)
        return
      }
    }
  }
}
