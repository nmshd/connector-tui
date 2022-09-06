import prompts from "prompts"
import { CONNECTOR_CLIENT } from "./globals"
import { selectRelationship } from "./selectors"

export async function sendReadRelationshipAttributeRequest() {
  const recipient = await selectRelationship("Which relationship do you want to send the request to?")
  if (!recipient) return console.log("No recipient selected")

  const result = await prompts([
    {
      message: "Whats the attribute type you would like to query?",
      type: "text",
      name: "attributeType",
      initial: "An attribute type",
    },
    {
      message: "Whats the key of the attribute you would like to query?",
      type: "text",
      name: "key",
      initial: "Key of RelationshipAttribute",
    },
    {
      message: "Whats the third party address?",
      type: "text",
      name: "thirdParty",
      initial: "Third party address",
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
            "@type": "RelationshipAttributeQuery",
            owner: "",
            valueType: result.attributeType,
            attributeCreationHints: {
              title: `A ${result.attributeType} attribute`,
              confidentiality: "public",
            },
            key: result.key,
            thirdParty: result.thirdParty ? result.thirdParty : undefined,
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

  console.log(`ReadAttributeRequest sent to ${recipient}`)
}
