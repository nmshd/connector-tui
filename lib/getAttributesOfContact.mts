import { ConnectorAttribute, CreateOutgoingRequestRequestContentItem } from "@nmshd/connector-sdk"
import prompts from "prompts"
import { CONNECTOR_CLIENT } from "./globals.mjs"

export async function getAttributesOfContact() {
  const relationships = (await CONNECTOR_CLIENT.relationships.getRelationships({}))
  if (relationships.isError) {
    console.error(relationships.error)
    return

  }
  const possibleRecipients = relationships.result.filter((r) => r.status === "Active").map((r) => r.peer)
  if (possibleRecipients.length === 0) {
    console.log("No recipients found")
    return
  }

  const recipientChoices = possibleRecipients.map((r) => ({ title: r, value: r }))

  const existingFiles = (await CONNECTOR_CLIENT.files.getOwnFiles()).result

  const recipientResult = await prompts({
    message: "From which contact do you want to get the attributes?",
    type: "select",
    name: "recipient",
    choices: recipientChoices,
  })
  const recipient = recipientResult.recipient

  const result = await prompts([
    
  ])

  const attributeResult = await CONNECTOR_CLIENT.attributes.getValidAttributes({
    shareInfo: { peer: recipient, sourceAttribute: "!" }
  })
  if (attributeResult.isError) {
    return console.error("Error while creating LocalRequest", attributeResult.error)
  }

  const attributes = (attributeResult.result as unknown) as ConnectorAttribute[]
  attributes.map((attribute => console.log(`${attribute.id}: ${attribute.content.value["@type"]} = ${attribute.content.value.value}`)))
}
