import { createQRCodeForRequest } from "./createQRCode.mjs"

export async function createSimpleQRCode() {
  const request = {
    "@type": "Request",
    items: [
      {
        "@type": "RequestItemGroup",
        mustBeAccepted: true,
        title: "Attribute die wir von dir brauchen",
        items: [
          {
            "@type": "ReadAttributeRequestItem",
            mustBeAccepted: true,
            query: {
              "@type": "IdentityAttributeQuery",
              valueType: "Nationality",
            },
          },
        ],
      },
    ],
  }

  await createQRCodeForRequest(request)
}
