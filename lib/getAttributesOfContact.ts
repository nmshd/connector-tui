import { CONNECTOR_CLIENT } from "./globals"
import { selectRelationship } from "./selectors"

export async function getAttributesOfContact() {
  const relationship = await selectRelationship("From which contact do you want to get the attributes?")
  if (!relationship) return console.log("No recipient selected")

  const attributeResult = await CONNECTOR_CLIENT.relationships.getAttributesForRelationship(relationship.id)

  const attributes = attributeResult.result.filter((a) => a.content.owner === relationship.peer)
  attributes.map((attribute) =>
    console.log(`${attribute.id}: ${attribute.content.value["@type"]} = ${attribute.content.value.value}`)
  )
}
