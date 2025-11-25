import { RelationshipStatus } from "@nmshd/connector-sdk"
import prompts from "prompts"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase.js"

export function AddDeleteAttribute<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class DeleteAttribute extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Delete Attribute", value: this.deleteAttribute })
    }

    protected async deleteAttribute() {
      const attributeType = await prompts({
        message: "Do you want to delete an own Attribute?",
        type: "confirm",
        name: "own",
      })

      if (attributeType.own) {
        const query = { content: { owner: this.connectorAddress } }
        const attribute = await this.selectAttribute("Which Attribute would you like to delete?", query)

        if (!attribute) {
          console.log("No Attribute selected")
          return
        }

        const result = await this.connectorClient.attributes.deleteAttributeAndNotify(attribute.id)
        if (result.isError) {
          console.log(result.error)
          return
        }

        console.log("Deleted Attribute successfully")
        return
      }

      const relationship = await this.selectRelationship(
        "From which peer do you want to delete an Attribute?",
        RelationshipStatus.Active,
        RelationshipStatus.Pending,
        RelationshipStatus.Terminated,
        RelationshipStatus.DeletionProposed
      )
      if (!relationship) {
        console.log("No peer selected")
        return
      }

      const query = { content: { owner: relationship.peerIdentity.address } }
      const attribute = await this.selectAttribute("Which Attribute would you like to delete?", query)

      if (!attribute) {
        console.log("No Attribute selected")
        return
      }

      const result = await this.connectorClient.attributes.deleteAttributeAndNotify(attribute.id)
      if (result.isError) {
        console.log(result.error)
        return
      }

      console.log("Deleted Attribute successfully")
    }
  }
}
