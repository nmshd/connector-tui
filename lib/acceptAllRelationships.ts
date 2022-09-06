import { ConnectorRelationship } from "@nmshd/connector-sdk"
import { CONNECTOR_CLIENT } from "./globals.js"

function acceptRelationship(r: ConnectorRelationship) {
  console.log(`Accepting relationship ${r.id}`)
  return CONNECTOR_CLIENT.relationships.acceptRelationshipChange(r.id, r.changes[0].id)
}
export async function acceptAllRelationships() {
  const syncResult = await CONNECTOR_CLIENT.account.sync()
  const newRelationships = syncResult.result.relationships
  await Promise.all(newRelationships.map(acceptRelationship))
}
