import prompts from "prompts"
import { CONNECTOR_CLIENT } from "./globals"
import { selectRelationship } from "./selectors"

export async function sendCreateRelationshipAttributeRequest() {
  const recipient = await selectRelationship("Which relationship do you want to send the request to?")
  if (!recipient) return console.log("No recipient selected")

  const result = await prompts([
    {
      message: "Whats the title of the RelationshipAttribute you would like to create?",
      type: "text",
      name: "title",
      initial: "Title of RelationshipAttribute",
    },
    {
      message: "Whats the key of the RelationshipAttribute you would like to create?",
      type: "text",
      name: "key",
      initial: "Key of RelationshipAttribute",
    },
    {
      message: "Whats the value of your Attribute?",
      type: "text",
      name: "value",
      initial: "Value",
    },
  ])

  const requestResult = await CONNECTOR_CLIENT.outgoingRequests.createRequest({
    peer: recipient,
    content: {
      items: [
        {
          "@type": "CreateRelationshipAttributeRequestItem",
          mustBeAccepted: true,
          attribute: {
            "@type": "RelationshipAttribute",
            owner: "",
            key: result.key,
            confidentiality: "public",
            value: {
              "@type": "ProprietaryString",
              value: result.value,
              title: result.title,
            },
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
    return console.error("Error while creating LocalRequest", messageResult.error)
  }

  console.log(`CreateRelationshipAttributeRequest sent to ${recipient}]`)
}
