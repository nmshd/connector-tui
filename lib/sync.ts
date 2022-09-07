import { CONNECTOR_CLIENT } from "./globals"

export async function sync() {
  const syncRequest = await CONNECTOR_CLIENT.account.sync()
  if (syncRequest.isError) {
    console.error(syncRequest.error)
    return
  }
  console.log(syncRequest.result)
}
