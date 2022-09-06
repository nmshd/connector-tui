import prompts from "prompts"
import { CONNECTOR_CLIENT } from "./globals"
import { selectRelationship } from "./selectors"

export async function sendProposeIdentityAttributeRequest() {
  const recipient = await selectRelationship("Which recipient do you want to send the request to?")
  if (!recipient) return console.log("No recipient selected")

  const result = await prompts([
    {
      message: "Whats the attribute type you would like to create?",
      type: "text",
      name: "attributeType",
      initial: "An attribute type",
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
          "@type": "ProposeAttributeRequestItem",
          mustBeAccepted: true,
          query: {
            "@type": "IdentityAttributeQuery",
            valueType: result.attributeType,
          },
          attribute: {
            "@type": "IdentityAttribute",
            owner: "",
            value: {
              "@type": result.attributeType,
              value: result.value,
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
    return console.error("Error while sending message", messageResult.error)
  }

  console.log(`ProposeAttributeRequest sent to ${recipient}]`)
}
