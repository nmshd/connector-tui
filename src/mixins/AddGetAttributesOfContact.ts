import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase"

export function AddGetAttributesOfContact<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class Sync extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Get Attributes Of Contact", value: this.getAttributesOfContact })
    }

    protected async getAttributesOfContact() {
      const relationship = await this.selectRelationship("From which contact do you want to get the attributes?")
      if (!relationship) return console.log("No recipient selected")

      const attributeResult = await this.connectorClient.relationships.getAttributesForRelationship(relationship.id)

      const attributes = attributeResult.result.filter((a) => a.content.owner === relationship.peer)
      attributes.map((attribute) => console.log(`${attribute.id}: ${attribute.content.value["@type"]} = ${attribute.content.value.value}`))
    }
  }
}
