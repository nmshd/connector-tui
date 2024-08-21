import { DateTime } from "luxon"
import qrcode from "qrcode-terminal"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase.js"

export function AddCreateAndShowTemplate<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class CreateAndShowTemplate extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Create And Show Template", value: this.createAndShowTemplate })
    }

    public async createAndShowTemplate() {
      const template = await this.connectorClient.relationshipTemplates.createOwnRelationshipTemplate({
        content: { "@type": "ArbitraryRelationshipTemplateContent", value: {} },
        expiresAt: DateTime.now().plus({ days: 2 }).toISO(),
      })

      const url = `nmshd://tr#${template.result.truncatedReference}`
      console.log(url)
      qrcode.generate(url, { small: true })
    }
  }
}
