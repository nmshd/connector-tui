import { ConnectorFile } from "@nmshd/connector-sdk"
import { DateTime } from "luxon"
import qrcode from "qrcode-terminal"
import { CONNECTOR_CLIENT } from "./globals.js"

export async function createQRCodeForRequest(request: unknown) {
  const name = "John"
  const sId = "12345"
  const type = "admin"

  const templateBody = {
    "@type": "RelationshipTemplateBody",
    title: `Kontaktanfrage mit ${name}`,
    metadata: {
      webSessionId: sId,
      type: type,
    },
    onNewRelationship: request,
  }

  const template = await CONNECTOR_CLIENT.relationshipTemplates.createOwnRelationshipTemplate({
    content: templateBody,
    expiresAt: DateTime.now().plus({ days: 2 }).toISO(),
  })

  const templateId = template.result.id
  const tokenResponse = await CONNECTOR_CLIENT.relationshipTemplates.createTokenForOwnRelationshipTemplate(templateId)
  const url = `nmshd://qr#${tokenResponse.result.truncatedReference}`
  console.log(url)
  qrcode.generate(url, { small: true })
}

export async function createQRCodeForFile(file: ConnectorFile) {
  const url = `nmshd://qr#${file.truncatedReference}`
  console.log(url)
  qrcode.generate(url, { small: true })
}
