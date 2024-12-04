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

      const passwordProtection = await this.createPasswordProtection()
      await this.createQRCodeForRelationshipTemplate(request, name, passwordProtection)
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

    private async createPasswordProtection(): Promise<{ password: string; passwordIsPin?: true } | undefined> {
      const result = await prompts({
        message: "What kind of password protection do you want to use?",
        type: "select",
        name: "passwordProtection",
        choices: [
          { title: "None", value: "None", selected: true },
          { title: "Password", value: "Password" },
          { title: "PIN", value: "PIN" },
        ],
      })

      if (result.passwordProtection === "None") return

      if (result.passwordProtection === "Password") {
        const password = await prompts({
          message: "Enter the password",
          type: "text",
          validate: (value) => {
            if (value.length < 1) return "Password must have at least 1 character"
            return true
          },
          name: "password",
        })

        return { password: password.password }
      }

      const password = await prompts({
        message: "Enter the PIN",
        type: "text",
        validate: (value) => {
          if (!/^\d+$/.test(value)) return "PIN must only contain digits"
          if (value.length < 4) return "PIN must have at least 4 digits"
          if (value.length > 16) return "PIN must have at most 16 digits"
          return true
        },
        name: "password",
      })

      return { password: password.password, passwordIsPin: true }
    }

    private async createQRCodeForRelationshipTemplate(request: RequestJSON, name: string, passwordProtection?: { password: string; passwordIsPin?: true }) {
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
        passwordProtection,
      })

      const url = `nmshd://tr#${template.result.truncatedReference}`
      console.log(url)
      qrcode.generate(url, { small: true })
    }
  }
}
