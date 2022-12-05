import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase"

export function AddGetAttributesOfRelationship<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class AddGetAttributesOfRelationship extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Get Attributes Of Relationship", value: this.getAttributesOfRelationship })
    }

    protected async getAttributesOfRelationship() {
      const relationship = await this.selectRelationship("From which relationship do you want to get the attributes?")
      if (!relationship) return console.log("No recipient selected")

      const attributeResult = await this.connectorClient.relationships.getAttributesForRelationship(relationship.id)
      if (attributeResult.isError) {
        console.log(attributeResult.error)
        return
      }

      const attributes = attributeResult.result.filter((a) => a.content.owner === relationship.peer || a.content["@type"] === "RelationshipAttribute")
      attributes.map((attribute: any) => {
        if (!attribute?.content?.value.value) {
          console.log(`${attribute.id}: ${attribute.content.value["@type"]}`)
          for (const propertyName in attribute.content.value) {
            if (propertyName === "@type") continue
            console.log(`   ${propertyName}: ${attribute.content.value[propertyName]}`)
          }
        } else if (attribute.content["@type"] === "RelationshipAttribute") {
          console.log(`${attribute.id}: ${attribute.content.value.title} [${attribute.content.value["@type"]}] = ${attribute.content.value.value}`)
        } else {
          console.log(`${attribute.id}: ${attribute.content.value["@type"]} = ${attribute.content.value.value}`)
        }
        return attribute
      })
    }
  }
}
