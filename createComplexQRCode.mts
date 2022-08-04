import { ConnectorIdentityAttribute } from "@nmshd/connector-sdk"
import { createQRCode } from "./createQRCode.mjs"
import { CONNECTOR_ADDRESS, CONNECTOR_CLIENT } from "./globals.mjs"

export async function createComplexQRCode() {
  const givenName = (
    await CONNECTOR_CLIENT.attributes.createAttribute({
      content: {
        "@type": "IdentityAttribute",
        owner: CONNECTOR_ADDRESS,
        value: {
          "@type": "GivenName",
          value: "Theo",
        },
      } as ConnectorIdentityAttribute,
    })
  ).result

  const surname = (
    await CONNECTOR_CLIENT.attributes.createAttribute({
      content: {
        "@type": "IdentityAttribute",
        owner: CONNECTOR_ADDRESS,
        value: {
          "@type": "Surname",
          value: "Templator",
        },
      } as ConnectorIdentityAttribute,
    })
  ).result

  const request = {
    "@type": "Request",
    items: [
      {
        "@type": "RequestItemGroup",
        mustBeAccepted: true,
        title: "Attribute von uns",
        items: [
          {
            "@type": "CreateAttributeRequestItem",
            mustBeAccepted: true,
            attribute: givenName.content,
            sourceAttributeId: givenName.id,
          },
          {
            "@type": "CreateAttributeRequestItem",
            mustBeAccepted: false,
            attribute: surname.content,
            sourceAttributeId: surname.id,
          },
        ],
      },
      {
        "@type": "RequestItemGroup",
        mustBeAccepted: true,
        title: "Attribute die wir über dich kennen",
        items: [
          {
            "@type": "ProposeAttributeRequestItem",
            mustBeAccepted: true,
            query: {
              "@type": "IdentityAttributeQuery",
              valueType: "GivenName",
            },
            attribute: {
              "@type": "IdentityAttribute",
              owner: CONNECTOR_ADDRESS,
              value: {
                "@type": "GivenName",
                value: "Horst",
              },
            },
          },
          {
            "@type": "ProposeAttributeRequestItem",
            mustBeAccepted: false,
            query: {
              "@type": "IdentityAttributeQuery",
              valueType: "Surname",
            },
            attribute: {
              "@type": "IdentityAttribute",
              owner: CONNECTOR_ADDRESS,
              value: {
                "@type": "Surname",
                value: "Becker",
              },
            },
          },
        ],
      },
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
          {
            "@type": "ReadAttributeRequestItem",
            mustBeAccepted: true,
            query: {
              "@type": "IdentityAttributeQuery",
              valueType: "CommunicationLanguage",
            },
          },
          {
            "@type": "ReadAttributeRequestItem",
            mustBeAccepted: false,
            query: {
              "@type": "IdentityAttributeQuery",
              valueType: "Sex",
            },
          },
          {
            "@type": "ReadAttributeRequestItem",
            mustBeAccepted: false,
            query: {
              "@type": "IdentityAttributeQuery",
              valueType: "BirthName",
            },
          },
        ],
      },
    ],
  }

  await createQRCode(request)
}
