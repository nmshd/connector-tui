import { ConnectorClient } from "@nmshd/connector-sdk"

export const CONNECTOR_CLIENT = ConnectorClient.create({
  baseUrl: "https://v2demo.is.enmeshed.eu/",
  apiKey: "QLZ95lqJIKMiUMLRxWFQR48sNR6wJtU6",
})

export const CONNECTOR_ADDRESS = (await CONNECTOR_CLIENT.account.getIdentityInfo()).result.address
