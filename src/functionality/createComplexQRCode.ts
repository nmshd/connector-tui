import { ConnectorIdentityAttribute } from "@nmshd/connector-sdk"
import { createQRCodeForRequest } from "./createQRCode"
import { CONNECTOR_ADDRESS, CONNECTOR_CLIENT } from "./globals"

export async function createComplexQRCode() {
  const displayName = process.env.CONNECTOR_DISPLAY_NAME || "ConnectorV2 Demo"

  const givenName = (
    await CONNECTOR_CLIENT.attributes.createAttribute({
      content: {
        "@type": "IdentityAttribute",
        owner: CONNECTOR_ADDRESS,
        value: {
          "@type": "DisplayName",
          value: displayName,
        },
      } as ConnectorIdentityAttribute,
    })
  ).result

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
            attribute: {
              "@type": "IdentityAttribute",
              owner: "",
              value: {
                "@type": "DisplayName",
                value: displayName,
              },
            },
            sourceAttributeId: givenName.id,
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

  await createQRCodeForRequest(request)
}
