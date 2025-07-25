import { RelationshipTemplateContentJSON, RequestItemGroupJSON, RequestJSON } from "@nmshd/content"
import { exec } from "child_process"
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
              valueType: "GivenName",
            },
          },
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
            mustBeAccepted: false,
            query: {
              "@type": "IdentityAttributeQuery",
              valueType: "EMailAddress",
            },
          },
        ],
      }

      const onNewRelationship: RequestJSON = { "@type": "Request", items: [] }

      const result = await prompts({
        message: "Do you want to send your connector's name?",
        type: "confirm",
        name: "includeName",
        initial: true,
      })

      if (result.includeName) onNewRelationship.items.push(sharedAttributes)
      onNewRelationship.items.push(requestedAttributes)

      const onExistingRelationship: RequestJSON = {
        "@type": "Request",
        title: "Existing Relationship",
        description: "Please accept the following request, because you already have a relationship with the requestor.",
        items: [
          {
            "@type": "RequestItemGroup",
            title: "A Title",
            description: "A Description that is long enough to show what a long description looks like in the app when rendered inside the expandable area",
            items: [
              {
                "@type": "ReadAttributeRequestItem",
                mustBeAccepted: true,
                query: {
                  "@type": "IdentityAttributeQuery",
                  valueType: "GivenName",
                },
              },
            ],
          },
        ],
      }

      const passwordProtection = await this.createPasswordProtection()
      await this.createQRCodeForRelationshipTemplate(onNewRelationship, onExistingRelationship, name, passwordProtection)
    }

    private async getOrCreateConnectorDisplayName(displayName: string) {
      const response = await this.connectorClient.attributes.getOwnRepositoryAttributes({ "content.value.@type": "DisplayName" })

      if (response.result.length > 0) return response.result[0]

      const createAttributeResponse = await this.connectorClient.attributes.createRepositoryAttribute({ content: { value: { "@type": "DisplayName", value: displayName } } })
      return createAttributeResponse.result
    }

    private async createPasswordProtection(): Promise<{ password: string; passwordIsPin?: true; passwordLocationIndicator?: string | number } | undefined> {
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

        const passwordLocationIndicator = await this.selectPasswordLocationIndicator()
        return { password: password.password, passwordLocationIndicator }
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

      const passwordLocationIndicator = await this.selectPasswordLocationIndicator()
      return { password: password.password, passwordIsPin: true, passwordLocationIndicator }
    }

    private async selectPasswordLocationIndicator(): Promise<string | number | undefined> {
      const result = await prompts({
        message: "Where can the user find the password?",
        type: "select",
        name: "passwordLocationIndicator",
        choices: [
          { title: "None", value: "None", selected: true },
          { title: "Custom (Number between 50 and 99)", value: "Custom" },
          { title: "Self", value: "Self" },
          { title: "Letter", value: "Letter" },
          { title: "RegistrationLetter", value: "RegistrationLetter" },
          { title: "Email", value: "Email" },
          { title: "SMS", value: "SMS" },
          { title: "Website", value: "Website" },
        ],
      })

      if (result.passwordLocationIndicator === "None") return
      if (result.passwordLocationIndicator !== "Custom") return result.passwordLocationIndicator

      const customLocation = await prompts({
        message: "Enter a number between 50 and 99",
        type: "number",
        validate: (value) => {
          if (value < 50 || value > 99) return "Number must be between 50 and 99"
          return true
        },
        name: "passwordLocationIndicator",
      })

      return customLocation.passwordLocationIndicator
    }

    private async createQRCodeForRelationshipTemplate(
      onNewRelationship: RequestJSON,
      onExistingRelationship: RequestJSON,
      name: string,
      passwordProtection?: {
        password: string
        passwordIsPin?: true
        passwordLocationIndicator?: string | number
      }
    ) {
      const content: RelationshipTemplateContentJSON = {
        "@type": "RelationshipTemplateContent",
        title: `Kontaktanfrage mit ${name}`,
        metadata: {
          webSessionId: "12345",
        },
        onNewRelationship,
        onExistingRelationship,
      }

      const template = await this.connectorClient.relationshipTemplates.createOwnRelationshipTemplate({
        content,
        expiresAt: DateTime.now().plus({ days: 2 }).toISO(),
        passwordProtection,
      })

      const url = template.result.reference.url
      console.log(url)
      qrcode.generate(url, { small: true })

      const result = await prompts({
        message: "Do you want to open the link on a connected device?",
        type: "confirm",
        name: "open",
        initial: false,
      })

      if (!result.open) return

      const androidOrIOS = await prompts({
        message: "Is the connected device Android or iOS?",
        type: "select",
        name: "deviceType",
        choices: [
          { title: "Android", value: "Android" },
          { title: "iOS", value: "iOS" },
        ],
      })

      if (!androidOrIOS.deviceType) return

      const command = androidOrIOS.deviceType === "Android" ? `adb shell am start -a android.intent.action.VIEW -d "${url}"` : `xcrun simctl openurl booted "${url}"`

      await new Promise<void>((resolve) => {
        exec(command, (err, _, __) => {
          if (err) return console.error(`Error executing command: ${err.message}`)

          resolve()
        })
      })
    }
  }
}
