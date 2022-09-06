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

async function getChoices(status: ConnectorRelationshipStatus) {
  const relationships = (await CONNECTOR_CLIENT.relationships.getRelationships({ status })).result

  const possibleRecipients = relationships.map((r) => r.peer)
  if (possibleRecipients.length === 0) {
    console.log(`No relationships with status '${status}' found`)
    return
  }

  const choices = await Promise.all(relationships.map((r) => renderRelationship(r)))
  return choices
}

export async function selectRelationship(
  prompt: string,
  status: ConnectorRelationshipStatus = ConnectorRelationshipStatus.ACTIVE
): Promise<string | undefined> {
  const recipientsResult = await prompts({
    message: prompt,
    type: "select",
    name: "recipient",
    choices: await getChoices(status),
  })

  return recipientsResult.recipient as string | undefined
}

export async function selectRelationships(
  prompt: string,
  status: ConnectorRelationshipStatus = ConnectorRelationshipStatus.ACTIVE
): Promise<string[] | undefined> {
  const recipientsResult = await prompts({
    message: prompt,
    type: "multiselect",
    name: "recipients",
    choices: await getChoices(status),
  })

  const recipients = recipientsResult.recipients as string[] | undefined
  if (!recipients || recipients.length === 0) {
    console.log("No recipients selected")
    return
  }

  return recipients
}
