import chalk from "chalk"
import dotenv from "dotenv"
import path from "path"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { ConnectorTUI } from "./ConnectorTUI"

const argv = await yargs(hideBin(process.argv))
  .option("env", {
    alias: "e",
    description: "location of the env file relative to cwd",
    type: "string",
    default: ".env",
  })
  .help()
  .alias("help", "h").argv

dotenv.config({ path: path.resolve(process.cwd(), argv.env) })

if (typeof process.env.BASE_URL === "undefined" || typeof process.env.API_KEY === "undefined") {
  console.log(chalk.red("Please provide a BASE_URL and API_KEY in your .env file or as environment variables."))
  process.exit(1)
}

const baseUrl = process.env.BASE_URL
const apiKey = process.env.API_KEY

const tui = await ConnectorTUI.create(baseUrl, apiKey)
await tui.run()
