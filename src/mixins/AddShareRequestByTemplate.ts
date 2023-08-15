import { ConnectorIdentityAttribute, ConnectorRelationshipTemplateContent, ConnectorRequestContent } from "@nmshd/connector-sdk"
import { DateTime } from "luxon"
import qrcode from "qrcode-terminal"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase"

export function AddShareRequestByTemplate<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class Sync extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Share Request By Template", value: this.shareRequestByTemplate })
    }

    public async shareRequestByTemplate() {
      const name = process.env.CONNECTOR_DISPLAY_NAME ?? "ConnectorV2 Demo"
      const displayName = await this.getOrCreateConnectorDisplayName(name)

      const request: ConnectorRequestContent = {
        items: [
          {
            "@type": "RequestItemGroup",
            mustBeAccepted: true,
            title: "Shared Attributes",
            items: [
              {
                "@type": "ShareAttributeRequestItem",
                mustBeAccepted: true,
                attribute: displayName.content,
                sourceAttributeId: displayName.id,
              },
            ],
          },
          {
            "@type": "RequestItemGroup",
            mustBeAccepted: true,
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
          },
        ],
      }

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

      const createAttributeResponse = await this.connectorClient.attributes.createAttribute({
        content: {
          "@type": "IdentityAttribute",
          owner: this.connectorAddress,
          value: {
            "@type": "DisplayName",
            value: displayName,
          },
        } as ConnectorIdentityAttribute,
      })

      return createAttributeResponse.result
    }

    private async createQRCodeForRelationshipTemplate(request: ConnectorRequestContent, name: string) {
      const content: ConnectorRelationshipTemplateContent = {
        "@type": "RelationshipTemplateContent",
        title: `Kontaktanfrage mit ${name}`,
        metadata: {
          webSessionId: "12345",
        },
        onNewRelationship: request,
      }

      const template = await this.connectorClient.relationshipTemplates.createOwnRelationshipTemplate({
        content,
        expiresAt: DateTime.now().plus({ days: 2 }).toISO()!,
      })

      const templateId = template.result.id
      const tokenResponse = await this.connectorClient.relationshipTemplates.createTokenForOwnRelationshipTemplate(templateId)
      const url = `nmshd://tr#${tokenResponse.result.truncatedReference}`
      console.log(url)
      qrcode.generate(url, { small: true })
    }
  }
}
