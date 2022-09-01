import { ConnectorClient } from "@nmshd/connector-sdk"
import dotenv from "dotenv"

dotenv.config()

export const CONNECTOR_CLIENT = ConnectorClient.create({
  baseUrl: process.env.BASE_URL!,
  apiKey: process.env.API_KEY!,
})

export const CONNECTOR_ADDRESS = (await CONNECTOR_CLIENT.account.getIdentityInfo()).result.address
