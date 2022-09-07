import { ConnectorRequest, ConnectorResponse } from "@nmshd/connector-sdk"
import prompts from "prompts"
import { CONNECTOR_CLIENT } from "./globals"
import { selectRelationship } from "./selectors"

export async function sendRequestByMessage() {
  const recipient = await selectRelationship("Which relationship do you want to send the request to?")
  if (!recipient) return console.log("No recipient selected")

  const peer = recipient.peer

  const whatRequest = await prompts({
    message: "What kind of request do you want to send?",
    type: "select",
    name: "requestMethod",
    choices: [
      { title: "ReadRelationshipAttributeRequest", value: createReadRelationshipAttributeRequest },
      { title: "ReadIdentityAttributeRequest", value: createReadIdentityAttributeRequest },
      { title: "ProposeAttributeRequest", value: createProposeAttributeRequest },
      { title: "CreateRelationshipAttributeRequest", value: createCreateRelationshipAttributeRequest },
    ],
  })

  if (!whatRequest.requestMethod) return console.log("No request method selected")

  const response: ConnectorResponse<ConnectorRequest> = await whatRequest.requestMethod(peer)
  if (response.isError) {
    return console.error("Error while creating LocalRequest", response.error)
  }

  const messageResult = await CONNECTOR_CLIENT.messages.sendMessage({
    recipients: [peer],
    content: response.result.content,
  })
  if (messageResult.isError) {
    return console.error("Error while sending message", messageResult.error)
  }

  console.log(`Request sent to '${peer}'`)
}

async function createReadRelationshipAttributeRequest(peer: string) {
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

  return await CONNECTOR_CLIENT.outgoingRequests.createRequest({
    peer,
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
}

async function createReadIdentityAttributeRequest(peer: string) {
  const result = await prompts([
    {
      message: "Whats the attribute type you would like to query?",
      type: "text",
      name: "attributeType",
      initial: "An attribute type",
    },
  ])

  return await CONNECTOR_CLIENT.outgoingRequests.createRequest({
    peer,
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
}

async function createProposeAttributeRequest(peer: string) {
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

  return await CONNECTOR_CLIENT.outgoingRequests.createRequest({
    peer,
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
}

async function createCreateRelationshipAttributeRequest(peer: string) {
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

  return await CONNECTOR_CLIENT.outgoingRequests.createRequest({
    peer,
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
}
