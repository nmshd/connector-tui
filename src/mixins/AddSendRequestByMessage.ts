import {
  AuthenticationRequestItem,
  ConnectorRequestContentItemGroup,
  ConsentRequestItem,
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
              title: "CreateIdentityAttributeRequestItem",
              value: this.createCreateIdentityAttributeRequestItem.bind(this),
            },
            {
              title: "ConsentRequestItem",
              value: this.createConsentRequestItem.bind(this),
            },
            {
              title: "AuthenticationRequestItem",
              value: this.createAuthenticationRequestItem.bind(this),
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
          {
            title: "Third Party Relationship Attribute",
            value: "ThirdPartyRelationshipAttribute",
          },
        ],
      })

      switch (whatAttribute.attributeType) {
        case "IdentityAttribute":
          return await this.createReadIdentityAttributeRequestItem()
        case "RelationshipAttribute":
          return await this.createReadRelationshipAttributeRequestItem()
        case "ThirdPartyRelationshipAttribute":
          return await this.createReadThirdPartyRelationshipAttributeRequestItem()
        default:
          return console.log("Invalid attribute type")
      }
    }

    private async createReadRelationshipAttributeRequestItem() {
      const result = await prompts([
        {
          message: "What's the attribute type you would like to query?",
          type: "text",
          name: "attributeType",
        },
        {
          message: "What's the title of the RelationshipAttribute?",
          type: "text",
          name: "attributeTitle",
          initial: "Attribute Title",
        },
        {
          message: "What's the description of the RelationshipAttribute?",
          type: "text",
          name: "attributeDescription",
          initial: "Attribute Title",
        },
        {
          message: "What's the key of the attribute you would like to query?",
          type: "text",
          name: "key",
          initial: "Key of RelationshipAttribute",
        },
        {
          message: "Who is the owner of the RelationshipAttribute?",
          type: "text",
          name: "owner",
        },
        {
          message: "What are the third party addresses? (comma-separated, optional)",
          type: "text",
          name: "thirdParties",
        },
      ])
      const title = result.attributeTitle ? result.attributeTitle : `A ${result.attributeType} attribute`

      const requestItem: ReadAttributeRequestItem = {
        "@type": "ReadAttributeRequestItem",
        mustBeAccepted: true,
        query: {
          "@type": "RelationshipAttributeQuery",
          owner: result.owner ? result.owner : "",
          attributeCreationHints: {
            title: title,
            description: result.attributeDescription,
            confidentiality: "public",
            valueType: result.attributeType,
          },
          key: result.key,
        },
      }

      return requestItem
    }

    private async createReadThirdPartyRelationshipAttributeRequestItem() {
      const result = await prompts([
        {
          message: "What's the attribute type you would like to query?",
          type: "text",
          name: "attributeType",
        },
        {
          message: "What's the key of the attribute you would like to query?",
          type: "text",
          name: "key",
          initial: "Key of RelationshipAttribute",
        },
        {
          message: "Who is the owner of the RelationshipAttribute?",
          type: "text",
          name: "owner",
        },
        {
          message: "What are the third party addresses? (comma-separated)",
          type: "text",
          name: "thirdParties",
        },
      ])

      const thirdParties = result.thirdParties
        .split(",")
        .map((address: string) => address.trim())
        .filter((address: string) => address.length > 0)

      const requestItem: ReadAttributeRequestItem = {
        "@type": "ReadAttributeRequestItem",
        mustBeAccepted: true,
        query: {
          "@type": "ThirdPartyRelationshipAttributeQuery",
          owner: result.owner ? result.owner : "",
          key: result.key,
          thirdParty: thirdParties,
        },
      }

      return requestItem
    }

    private async createReadIdentityAttributeRequestItem() {
      const result = await prompts([
        {
          message: "What's the attribute type you would like to query?",
          type: "text",
          name: "attributeType",
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
          message: "What's the attribute type you would like to create?",
          type: "text",
          name: "attributeType",
        },
        {
          message: "What's the value of your Attribute?",
          type: "text",
          name: "value",
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
          message: "What's the title of the RelationshipAttribute you would like to create?",
          type: "text",
          name: "title",
          initial: "Title of RelationshipAttribute",
        },
        {
          message: "What's the key of the RelationshipAttribute you would like to create?",
          type: "text",
          name: "key",
          initial: "Key of RelationshipAttribute",
        },
        {
          message: "What's the value of your Attribute?",
          type: "text",
          name: "value",
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

    private async createCreateIdentityAttributeRequestItem(peer: string) {
      const result = await prompts([
        {
          message: "What's the value type of the IdentityAttribute you would like to create?",
          type: "text",
          name: "valueType",
        },
        {
          message: "What's the value of the Attribute?",
          type: "text",
          name: "value",
        },
      ])

      const requestItem: CreateAttributeRequestItem = {
        "@type": "CreateAttributeRequestItem",
        mustBeAccepted: true,
        attribute: {
          "@type": "IdentityAttribute",
          owner: peer,
          value: {
            "@type": result.valueType,
            value: result.value,
          },
        },
      }

      return requestItem
    }

    private async createConsentRequestItem() {
      const result = await prompts([
        {
          message: "What's the consent the peer should agree to?",
          type: "text",
          name: "consent",
        },
        {
          message: "[Optional] Enter the URL to to the consent details?",
          type: "text",
          name: "link",
        },
        {
          message: "[Optional] Enter a consentKey to know which consent the user agreed to",
          type: "text",
          name: "consentKey",
        },
      ])

      const responseMetadata = result.consentKey ? { consentKey: result.consentKey } : undefined
      const link = result.link ? result.link : undefined

      const requestItem: ConsentRequestItem = {
        "@type": "ConsentRequestItem",
        mustBeAccepted: true,
        consent: result.consent,
        link,
        responseMetadata,
      }

      return requestItem
    }

    private async createAuthenticationRequestItem() {
      const result = await prompts([
        {
          message: "Enter a title of the authentication",
          type: "text",
          name: "title",
        },
        {
          message: "[Optional] Enter an unique authenticationToken to know which authentication did the user grant",
          type: "text",
          name: "authenticationToken",
        },
      ])

      const responseMetadata = result.authenticationToken ? { authenticationToken: result.authenticationToken } : undefined

      const requestItem: AuthenticationRequestItem = {
        "@type": "AuthenticationRequestItem",
        mustBeAccepted: true,
        title: result.title,
        responseMetadata,
      }

      return requestItem
    }
  }
}
