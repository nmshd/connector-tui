import chalk from "chalk"
import dotenv from "dotenv"
import { ConnectorTUI } from "./ConnectorTUI"

dotenv.config()

if (typeof process.env.BASE_URL === "undefined" || typeof process.env.API_KEY === "undefined") {
  console.log(chalk.red("Please provide a BASE_URL and API_KEY in your .env file or as environment variables."))
  process.exit(1)
}

const baseUrl = process.env.BASE_URL
const apiKey = process.env.API_KEY

const tui = await ConnectorTUI.create(baseUrl, apiKey)
await tui.run()
