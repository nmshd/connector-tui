import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase.js"

export function AddTerminateAndDecomposeRelationship<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class TerminateAndDecomposeRelationship extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Terminate and Decompose Relationship", value: this.terminateAndDecomposeRelationship })
    }

    protected async terminateAndDecomposeRelationship() {
      const relationship = await this.selectRelationship("Select relationship to terminate and decompose")
      if (!relationship) return

      console.log(`Terminating relationship ${relationship.id}`)
      await this.connectorClient.relationships.terminateRelationship(relationship.id)

      console.log(`Decomposing relationship ${relationship.id}`)
      await this.connectorClient.relationships.decomposeRelationship(relationship.id)
    }
  }
}
