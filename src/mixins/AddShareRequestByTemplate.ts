import { RelationshipTemplateContentJSON, RequestItemGroupJSON, RequestJSON } from "@nmshd/content"
import { DateTime } from "luxon"
import prompts from "prompts"
import qrcode from "qrcode-terminal"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase.js"

export function AddShareRequestByTemplate<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class ShareRequestByTemplate extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Share Request By Template", value: this.shareRequestByTemplate })
    }

    public async shareRequestByTemplate() {
      const name = process.env.CONNECTOR_DISPLAY_NAME ?? "Connector TUI"
      const displayName = await this.getOrCreateConnectorDisplayName(name)

      const sharedAttributes: RequestItemGroupJSON = {
        "@type": "RequestItemGroup",
        title: "Shared Attributes",
        items: [
          {
            "@type": "ShareAttributeRequestItem",
            mustBeAccepted: true,
            attribute: displayName.content,
            sourceAttributeId: displayName.id,
          },
        ],
      }

      const requestedAttributes: RequestItemGroupJSON = {
        "@type": "RequestItemGroup",
        title: "Requested Attributes",
        items: [
          {
            "@type": "ReadAttributeRequestItem",
            mustBeAccepted: true,
            query: {
              "@type": "IdentityAttributeQuery",
              valueType: "Surname",
            },
          },
          {
            "@type": "ReadAttributeRequestItem",
            mustBeAccepted: true,
            query: {
              "@type": "IdentityAttributeQuery",
              valueType: "GivenName",
            },
          },
          {
            "@type": "ReadAttributeRequestItem",
            mustBeAccepted: false,
            query: {
              "@type": "IdentityAttributeQuery",
              valueType: "EMailAddress",
            },
          },
        ],
      }

      const request: RequestJSON = { "@type": "Request", items: [] }

      const result = await prompts({
        message: "Do you want to send your connector's name?",
        type: "confirm",
        name: "includeName",
        initial: true,
      })

      if (result.includeName) request.items.push(sharedAttributes)
      request.items.push(requestedAttributes)

      await this.createQRCodeForRelationshipTemplate(request, name)
    }

    private async getOrCreateConnectorDisplayName(displayName: string) {
      const response = await this.connectorClient.attributes.getValidAttributes({
        content: {
          owner: this.connectorAddress,
          value: {
            "@type": "DisplayName",
          },
        },
        shareInfo: {
          peer: "!",
        },
      })

      if (response.result.length > 0) {
        return response.result[0]
      }

      const createAttributeResponse = await this.connectorClient.attributes.createRepositoryAttribute({
        content: {
          value: {
            "@type": "DisplayName",
            value: displayName,
          },
        },
      })

      return createAttributeResponse.result
    }

    private async createQRCodeForRelationshipTemplate(request: RequestJSON, name: string) {
      const content: RelationshipTemplateContentJSON = {
        "@type": "RelationshipTemplateContent",
        title: `Kontaktanfrage mit ${name}`,
        metadata: {
          webSessionId: "12345",
        },
        onNewRelationship: request,
      }

      const template = await this.connectorClient.relationshipTemplates.createOwnRelationshipTemplate({
        content,
        expiresAt: DateTime.now().plus({ days: 2 }).toISO(),
      })

      const url = `nmshd://tr#${template.result.truncatedReference}`
      console.log(url)
      qrcode.generate(url, { small: true })
    }
  }
}
