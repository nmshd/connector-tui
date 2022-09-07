import { ConnectorRelationship, ConnectorRelationshipStatus } from "@nmshd/connector-sdk"
import prompts from "prompts"
import { CONNECTOR_CLIENT } from "../globals"

async function renderRelationship(
  relationship: ConnectorRelationship,
  returnRelationship: boolean
): Promise<prompts.Choice> {
  const value = returnRelationship ? relationship : relationship.peer
  const response = await CONNECTOR_CLIENT.relationships.getAttributesForRelationship(relationship.id)
  const relationshipAttributes = response.result.filter((a) => a.content.owner === relationship.peer)

  const displayName = relationshipAttributes.find((a) => a.content.value["@type"] === "DisplayName")
  if (displayName) {
    return { title: `${relationship.peer} (${displayName.content.value.value})`, value }
  }

  const surname = relationshipAttributes.find((a) => a.content.value["@type"] === "Surname")
  const givenName = relationshipAttributes.find((a) => a.content.value["@type"] === "GivenName")
  if (surname || givenName) {
    const name = `${surname?.content.value.value || ""} ${givenName?.content.value.value || ""}`.trim()
    return {
      title: `${relationship.peer} (${name})`,
      value,
    }
  }

  return { title: relationship.peer, value }
}

async function getChoices(status: ConnectorRelationshipStatus, returnRelationship: boolean) {
  const relationships = (await CONNECTOR_CLIENT.relationships.getRelationships({ status })).result
  if (relationships.length === 0) {
    console.log(`No relationships with status '${status}' found`)
    return
  }

  const choices = await Promise.all(relationships.map((r) => renderRelationship(r, returnRelationship)))
  return choices
}

export async function selectRelationship(
  prompt: string,
  status: ConnectorRelationshipStatus = ConnectorRelationshipStatus.ACTIVE
): Promise<ConnectorRelationship | undefined> {
  const choices = await getChoices(status, true)
  if (!choices) return

  const recipientsResult = await prompts({ message: prompt, type: "select", name: "recipient", choices })

  return recipientsResult.recipient as ConnectorRelationship | undefined
}

export async function selectRelationships(
  prompt: string,
  status: ConnectorRelationshipStatus = ConnectorRelationshipStatus.ACTIVE
): Promise<string[] | undefined> {
  const choices = await getChoices(status, false)
  if (!choices) return

  const recipientsResult = await prompts({ message: prompt, type: "multiselect", name: "recipients", choices })

  const recipients = recipientsResult.recipients as string[] | undefined
  if (!recipients || recipients.length === 0) {
    console.log("No recipients selected")
    return
  }

  return recipients
}
