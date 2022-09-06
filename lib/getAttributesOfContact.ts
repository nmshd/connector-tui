import { ConnectorAttribute } from "@nmshd/connector-sdk"
import { CONNECTOR_CLIENT } from "./globals"
import { selectRelationship } from "./selectors"

export async function getAttributesOfContact() {
  const recipient = await selectRelationship("From which contact do you want to get the attributes?")
  if (!recipient) return console.log("No recipient selected")

  const attributeResult = await CONNECTOR_CLIENT.attributes.getValidAttributes({
    shareInfo: { peer: recipient, sourceAttribute: "!" },
  })
  if (attributeResult.isError) {
    return console.error("Error while creating LocalRequest", attributeResult.error)
  }

  const attributes = attributeResult.result as unknown as ConnectorAttribute[]
  attributes.map((attribute) =>
    console.log(`${attribute.id}: ${attribute.content.value["@type"]} = ${attribute.content.value.value}`)
  )
}
