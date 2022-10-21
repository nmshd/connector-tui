import { ConnectorRequest, ConnectorResponse } from "@nmshd/connector-sdk"
import prompts from "prompts"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase"

export function AddSendRequestByMessage<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class Sync extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Send Request By Message", value: this.sendRequestByMessage })
    }

    protected async sendRequestByMessage() {
      const recipient = await this.selectRelationship("Which relationship do you want to send the request to?")
      if (!recipient) return console.log("No recipient selected")

      const peer = recipient.peer

      const whatRequest = await prompts({
        message: "What kind of request do you want to send?",
        type: "select",
        name: "requestMethod",
        choices: [
          {
            title: "ReadRelationshipAttributeRequest",
            value: this.createReadRelationshipAttributeRequest.bind(this),
          },
          {
            title: "ReadIdentityAttributeRequest",
            value: this.createReadIdentityAttributeRequest.bind(this),
          },
          {
            title: "ProposeAttributeRequest",
            value: this.createProposeAttributeRequest.bind(this),
          },
          {
            title: "CreateRelationshipAttributeRequest",
            value: this.createCreateRelationshipAttributeRequest.bind(this),
          },
          {
            title: "CreateIdentityAttributeRequest",
            value: this.createCreateIdentityAttributeRequest.bind(this),
          },
          {
            title: "ConsentRequest",
            value: this.createConsentRequest.bind(this),
          },
          {
            title: "AuthenticationRequest",
            value: this.createAuthenticationRequest.bind(this),
          },
        ],
      })

      if (!whatRequest.requestMethod) return console.log("No request method selected")

      const response: ConnectorResponse<ConnectorRequest> = await whatRequest.requestMethod(peer)
      if (response.isError) {
        return console.error("Error while creating LocalRequest", response.error)
      }

      const messageResult = await this.connectorClient.messages.sendMessage({
        recipients: [peer],
        content: response.result.content,
      })
      if (messageResult.isError) {
        return console.error("Error while sending message", messageResult.error)
      }

      console.log(`Request sent to '${peer}'`)
    }

    private async createConsentRequest(peer: string) {
      const result = await prompts([
        {
          message: "Whats the consent the peer should agree to?",
          type: "text",
          name: "consent",
          initial: "A statement the user should agree to",
        },
        {
          message: "[Optional] Enter the URL to to the consent details?",
          type: "text",
          name: "link",
          initial: "An URL to the consent.",
        },
        {
          message: "[Optional] Enter a consentKey to know which consent the user agreed to",
          type: "text",
          name: "consentKey",
          initial: "A key to the consent",
        },
      ])

      return await this.connectorClient.outgoingRequests.createRequest({
        peer,
        content: {
          items: [
            {
              "@type": "ConsentRequestItem",
              mustBeAccepted: true,
              consent: result.consent,
              link: result.link,
              responseMetadata: {
                consentKey: result.consentKey,
              },
            },
          ],
        },
      })
    }

    private async createAuthenticationRequest(peer: string) {
      const result = await prompts([
        {
          message: "Enter a title of the authentication",
          type: "text",
          name: "title",
          initial: "Authentication Title",
        },
        {
          message: "[Optional] Enter an unique authenticationToken to know which authentication did the user grant",
          type: "text",
          name: "authenticationToken",
          initial: "Some unique id",
        },
      ])

      return await this.connectorClient.outgoingRequests.createRequest({
        peer,
        content: {
          items: [
            {
              "@type": "AuthenticationRequestItem",
              mustBeAccepted: true,
              title: result.title,
              responseMetadata: {
                authenticationToken: result.authenticationToken,
              },
            },
          ],
        },
      })
    }

    private async createReadRelationshipAttributeRequest(peer: string) {
      const result = await prompts([
        {
          message: "Whats the attribute type you would like to query?",
          type: "text",
          name: "attributeType",
          initial: "An attribute type",
        },
        {
          message: "Whats the title of the RelationshipAttribute?",
          type: "text",
          name: "attributeTitle",
          initial: "Attribute Title",
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
      const title = result.attributeTitle ? result.attributeTitle : `A ${result.attributeType} attribute`

      return await this.connectorClient.outgoingRequests.createRequest({
        peer,
        content: {
          items: [
            {
              "@type": "ReadAttributeRequestItem",
              mustBeAccepted: true,
              query: {
                "@type": "RelationshipAttributeQuery",
                owner: "",
                attributeCreationHints: {
                  title: title,
                  confidentiality: "public",
                  valueType: result.attributeType,
                },
                key: result.key,
              },
            },
          ],
        },
      })
    }

    private async createReadIdentityAttributeRequest(peer: string) {
      const result = await prompts([
        {
          message: "Whats the attribute type you would like to query?",
          type: "text",
          name: "attributeType",
          initial: "An attribute type",
        },
      ])

      return await this.connectorClient.outgoingRequests.createRequest({
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

    private async createProposeAttributeRequest(peer: string) {
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

      return await this.connectorClient.outgoingRequests.createRequest({
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

    private async createCreateRelationshipAttributeRequest(peer: string) {
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

      return await this.connectorClient.outgoingRequests.createRequest({
        peer,
        content: {
          items: [
            {
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
            },
          ],
        },
      })
    }

    private async createCreateIdentityAttributeRequest(peer: string) {
      const result = await prompts([
        {
          message: "Whats the value type of the IdentityAttribute you would like to create?",
          type: "text",
          name: "valueType",
          initial: "ValueType",
        },
        {
          message: "Whats the value of the Attribute?",
          type: "text",
          name: "value",
          initial: "Value",
        },
      ])

      return await this.connectorClient.outgoingRequests.createRequest({
        peer,
        content: {
          items: [
            {
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
            },
          ],
        },
      })
    }
  }
}
