import prompts from "prompts"
import { CONNECTOR_CLIENT } from "./globals"
import { selectRelationship } from "./selectors"

export async function sendReadIdentityAttributeRequest() {
  const recipient = await selectRelationship("Which recipient do you want to send the request to?")
  if (!recipient) return console.log("No recipient selected")

  const result = await prompts([
    {
      message: "Whats the attribute type you would like to query?",
      type: "text",
      name: "attributeType",
      initial: "An attribute type",
    },
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
            valueType: result.attributeType,
          },
        },
      ],
    },
  })
  if (requestResult.isError) {
    return console.error("Error while creating LocalRequest", requestResult.error)
  }

  const messageResult = await CONNECTOR_CLIENT.messages.sendMessage({
    recipients: [recipient],
    content: requestResult.result.content,
    attachments: [],
  })
  if (messageResult.isError) {
    return console.error("Error while sending message", messageResult.error)
  }

  console.log(`ReadAttributeRequest sent to ${recipient}]`)
}
