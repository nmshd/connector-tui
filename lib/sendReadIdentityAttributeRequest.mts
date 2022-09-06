import { CreateOutgoingRequestRequestContentItem } from "@nmshd/connector-sdk"
import prompts from "prompts"
import { CONNECTOR_CLIENT } from "./globals.mjs"

export async function sendReadIdentityAttributeRequest() {
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
    message: "Which recipient do you want to send the request to?",
    type: "select",
    name: "recipient",
    choices: recipientChoices,
  })
  const recipient = recipientResult.recipient

  const result = await prompts([
    {
      message: "Whats the attribute type you would like to query?",
      type: "text",
      name: "attributeType",
      initial: "An attribute type",
    }
  ])

  const requestResult = await CONNECTOR_CLIENT.outgoingRequests.createRequest({
    peer: recipient,
    content: {
      items: [
        {
          "@type": "ReadAttributeRequestItem",
          mustBeAccepted: true,
          query: {
            "@type": "IdentityAttributeQuery",
            valueType: result.attributeType
          }
        } as CreateOutgoingRequestRequestContentItem
      ]
    }
  })
  if (requestResult.isError) {
    return console.error("Error while creating LocalRequest", requestResult.error)
  }

  const messageResult = await CONNECTOR_CLIENT.messages.sendMessage({
    recipients: [recipient],
    content: requestResult.result.content,
    attachments: []
  })
  if (messageResult.isError) {
    return console.error("Error while sending message", messageResult.error)
  }

  console.log(`ReadAttributeRequest sent to ${recipient}]`)
}
