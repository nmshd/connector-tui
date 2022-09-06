import { ConnectorRelationship, ConnectorRelationshipStatus } from "@nmshd/connector-sdk"
import prompts from "prompts"
import { CONNECTOR_CLIENT } from "../globals"

async function renderRelationship(relationship: ConnectorRelationship): Promise<prompts.Choice> {
  const response = await CONNECTOR_CLIENT.relationships.getAttributesForRelationship(relationship.id)
  const relationshipAttributes = response.result.filter((a) => a.content.owner === relationship.peer)

  const displayName = relationshipAttributes.find((a) => a.content.value["@type"] === "DisplayName")
  if (displayName) {
    return { title: `${relationship.peer} (${displayName.content.value.value})`, value: relationship.id }
  }

  const surname = relationshipAttributes.find((a) => a.content.value["@type"] === "Surname")
  const givenName = relationshipAttributes.find((a) => a.content.value["@type"] === "GivenName")
  if (surname || givenName) {
    const name = `${surname?.content.value.value || ""} ${givenName?.content.value.value || ""}`.trim()
    return {
      title: `${relationship.peer} (${name})`,
      value: relationship.id,
    }
  }

  return { title: relationship.peer, value: relationship.id }
}

export async function selectRelationships(
  status: ConnectorRelationshipStatus = ConnectorRelationshipStatus.ACTIVE
): Promise<string[] | undefined> {
  const relationships = (await CONNECTOR_CLIENT.relationships.getRelationships({ status })).result

  const possibleRecipients = relationships.map((r) => r.peer)
  if (possibleRecipients.length === 0) {
    console.log(`No relationships with status '${status}' found`)
    return
  }

  const choices = await Promise.all(relationships.map((r) => renderRelationship(r)))

  const recipientsResult = await prompts({
    message: "Which recipient(s) do you want to send the message to?",
    type: "multiselect",
    name: "recipients",
    choices,
  })

  const recipients = recipientsResult.recipients as string[] | undefined
  if (!recipients || recipients.length === 0) {
    console.log("No recipients selected")
    return
  }

  return recipients
}
