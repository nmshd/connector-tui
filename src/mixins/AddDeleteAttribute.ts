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
      const result = await prompts({
        message: "Do you want to delete an own Attribute?",
        type: "confirm",
        name: "own",
        initial: true,
      })

      if (result.own) {
        const query = { content: { owner: this.connectorAddress } }
        const attribute = await this.selectAttribute("Which Attribute would you like to delete?", query)

        if (!attribute) {
          console.log("No Attributes selected")
          return
        }

        await this.connectorClient.attributes.deleteAttributeAndNotify(attribute.id)
        return
      }

      const relationship = await this.selectRelationship(
        "From which peer do you want to delete an Attribute?",
        RelationshipStatus.Active,
        RelationshipStatus.Pending,
        RelationshipStatus.Terminated,
        RelationshipStatus.DeletionProposed
      )
      if (!relationship) return console.log("No peer selected")

      const attributeResult = await this.connectorClient.relationships.getAttributesForRelationship(relationship.id)

      if (attributeResult.isError) {
        console.log(attributeResult.error)
        return
      }

      if (attributeResult.result.length === 0) {
        console.log("The selected peer didn't share any Attributes with you")
        return
      }

      const query = { content: { owner: relationship.peerIdentity.address } }
      const attribute = await this.selectAttribute("Which Attribute would you like to delete?", query)

      if (!attribute) {
        console.log("No Attributes selected")
        return
      }

      await this.connectorClient.attributes.deleteAttributeAndNotify(attribute.id)
    }
  }
}
