import {
  ConnectorRequestContentItemGroup,
  CreateAttributeRequestItem,
  CreateOutgoingRequestRequestContentItemDerivations,
  ProposeAttributeRequestItem,
  ReadAttributeRequestItem,
} from "@nmshd/connector-sdk"
import prompts from "prompts"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase"

export function AddSendRequestByMessage<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class SendRequestByMessage extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Send Request By Message", value: this.sendRequestByMessage })
    }

    protected async sendRequestByMessage() {
      const recipient = await this.selectRelationship("Which relationship do you want to send the request to?")
      if (!recipient) return console.log("No recipient selected")

      const peer = recipient.peer

      const requestItems: (CreateOutgoingRequestRequestContentItemDerivations | ConnectorRequestContentItemGroup)[] = []

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition,no-constant-condition
      while (true) {
        const whatRequest = await prompts({
          message: "What kind of request do you want to send?",
          type: "select",
          name: "requestMethod",
          choices: [
            {
              title: "ReadAttributeRequestItem",
              value: this.createReadAttributeRequestItem.bind(this),
            },
            {
              title: "ProposeAttributeRequestItem",
              value: this.createProposeAttributeRequestItem.bind(this),
            },
            {
              title: "CreateRelationshipAttributeRequestItem",
              value: this.createCreateRelationshipAttributeRequestItem.bind(this),
            },
            {
              title: "No more items please",
              value: "no-more",
            },
          ],
        })

        if (!whatRequest.requestMethod) return

        if (typeof whatRequest.requestMethod !== "function") {
          break
        }

        const requestItemJSON = await whatRequest.requestMethod(peer)
        requestItems.push(requestItemJSON)
      }

      if (requestItems.length === 0) {
        console.error("You have to add at least one item.")
        return
      }

      const response = await this.connectorClient.outgoingRequests.createRequest({
        peer,
        content: {
          items: requestItems,
        },
      })

      if (response.isError) {
        return console.error("Error while creating LocalRequest", response.error)
      }

      const messageResponse = await this.connectorClient.messages.sendMessage({
        recipients: [peer],
        content: response.result.content,
      })

      if (messageResponse.isError) {
        return console.error("Error while sending message", messageResponse.error)
      }

      console.log("The following Request was sent:", JSON.stringify(response.result.content, null, 2))

      console.log(`Request sent to '${peer}'`)
    }

    private async createReadAttributeRequestItem() {
      const whatAttribute = await prompts({
        message: "What kind of Attribute do you want to read?",
        type: "select",
        name: "attributeType",
        choices: [
          {
            title: "Identity Attribute",
            value: "IdentityAttribute",
          },
          {
            title: "Relationship Attribute",
            value: "RelationshipAttribute",
          },
        ],
      })

      switch (whatAttribute.attributeType) {
        case "IdentityAttribute":
          return await this.createReadIdentityAttributeRequestItem()
        case "RelationshipAttribute":
          return await this.createReadRelationshipAttributeRequestItem()
        default:
          return console.log("Invalid attribute type")
      }
    }

    private async createReadRelationshipAttributeRequestItem() {
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
          message: "Whats the title?",
          type: "text",
          name: "title",
          initial: "Attribute Title",
        },
        {
          message: "Whats the description?",
          type: "text",
          name: "description",
          initial: "Attribute Description",
        },
        {
          message: "Whats the third party address? (optional)",
          type: "text",
          name: "thirdParty",
          initial: "Third party address",
        },
      ])

      const requestItem: ReadAttributeRequestItem = {
        "@type": "ReadAttributeRequestItem",
        mustBeAccepted: true,
        query: {
          "@type": "RelationshipAttributeQuery",
          owner: "",
          attributeCreationHints: {
            title: result.title,
            description: result.description,
            confidentiality: "public",
            valueType: result.attributeType,
          },
          key: result.key,
        },
      }

      return requestItem
    }

    private async createReadIdentityAttributeRequestItem() {
      const result = await prompts([
        {
          message: "Whats the attribute type you would like to query?",
          type: "text",
          name: "attributeType",
          initial: "An attribute type",
        },
      ])

      const requestItem: ReadAttributeRequestItem = {
        "@type": "ReadAttributeRequestItem",
        mustBeAccepted: true,
        query: {
          "@type": "IdentityAttributeQuery",
          valueType: result.attributeType,
        },
      }

      return requestItem
    }

    private async createProposeAttributeRequestItem() {
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

      const requestItem: ProposeAttributeRequestItem = {
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
      }

      return requestItem
    }

    private async createCreateRelationshipAttributeRequestItem() {
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

      const requestItem: CreateAttributeRequestItem = {
        "@type": "CreateAttributeRequestItem",
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
      }

      return requestItem
    }
  }
}
