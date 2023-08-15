import { DateTime } from "luxon"
import qrcode from "qrcode-terminal"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase"

export function AddCreateAndShowTemplate<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class CreateAndShowTemplate extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Create And Show Template", value: this.createAndShowTemplate })
    }

    public async createAndShowTemplate() {
      const template = await this.connectorClient.relationshipTemplates.createOwnRelationshipTemplate({
        content: {},
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
