import { ConnectorRelationship, ConnectorRelationshipStatus } from "@nmshd/connector-sdk"
import prompts from "prompts"
import { CONNECTOR_CLIENT } from "./globals"

function acceptRelationship(r: ConnectorRelationship) {
  console.log(`Accepting relationship ${r.id}`)
  return CONNECTOR_CLIENT.relationships.acceptRelationshipChange(r.id, r.changes[0].id)
}
export async function acceptPendingRelationships() {
  const result = await prompts({
    message: "Do you want to sync before accepting pending relationships?",
    type: "confirm",
    name: "sync",
  })

  if (result.sync) {
    await CONNECTOR_CLIENT.account.sync()
  }

  const pendingRelationships = (
    await CONNECTOR_CLIENT.relationships.getRelationships({
      status: ConnectorRelationshipStatus.PENDING,
    })
  ).result

  await Promise.all(pendingRelationships.map(acceptRelationship))
}
