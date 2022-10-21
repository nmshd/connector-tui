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
