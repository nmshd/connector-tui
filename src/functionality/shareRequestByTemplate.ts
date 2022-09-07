import { ConnectorIdentityAttribute } from "@nmshd/connector-sdk"
import { DateTime } from "luxon"
import qrcode from "qrcode-terminal"
import { CONNECTOR_ADDRESS, CONNECTOR_CLIENT } from "./globals"

export async function shareRequestByTemplate() {
  const name = process.env.CONNECTOR_DISPLAY_NAME || "ConnectorV2 Demo"
  const displayName = await getOrCreateConnectorDisplayName(name)

  const request = {
    items: [
      {
        "@type": "RequestItemGroup",
        mustBeAccepted: true,
        title: "Shared Attributes",
        items: [
          {
            "@type": "ShareAttributeRequestItem",
            mustBeAccepted: true,
            attribute: { ...displayName.content, owner: "" },
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

  await createQRCodeForRelationshipTemplate(request, name)
}

async function getOrCreateConnectorDisplayName(displayName: string) {
  const response = await CONNECTOR_CLIENT.attributes.getValidAttributes({
    content: {
      owner: CONNECTOR_ADDRESS,
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

  const createAttributeResponse = await CONNECTOR_CLIENT.attributes.createAttribute({
    content: {
      "@type": "IdentityAttribute",
      owner: CONNECTOR_ADDRESS,
      value: {
        "@type": "DisplayName",
        value: displayName,
      },
    } as ConnectorIdentityAttribute,
  })

  return createAttributeResponse.result
}

async function createQRCodeForRelationshipTemplate(request: unknown, name: string) {
  const templateBody = {
    "@type": "RelationshipTemplateBody",
    title: `Kontaktanfrage mit ${name}`,
    metadata: {
      webSessionId: "12345",
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
