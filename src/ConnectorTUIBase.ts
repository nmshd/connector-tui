import { ConnectorSupportInformation, FileDTO, GetAttributesRequest, LocalAttributeDTO, RelationshipDTO, RelationshipStatus } from "@nmshd/connector-sdk"
import { DisplayNameJSON, GivenNameJSON, SurnameJSON } from "@nmshd/content"
import { DateTime } from "luxon"
import prompts from "prompts"
import { ConnectorClient } from "./client/ConnectorClient.js"

export type ConnectorTUIBaseConstructor = new (...args: any[]) => ConnectorTUIBase

export interface ConnectorTUIChoice extends prompts.Choice {
  value(): Promise<void>
}

export class ConnectorTUIBase {
  protected choices: ConnectorTUIChoice[] = []
  protected choicesInDeletion: ConnectorTUIChoice[] = []

  public constructor(
    protected connectorClient: ConnectorClient,
    protected connectorAddress: string,
    protected support: ConnectorSupportInformation
  ) {}

  protected async selectRelationship(prompt: string, ...status: RelationshipStatus[]): Promise<RelationshipDTO | undefined> {
    if (status.length === 0) status.push(RelationshipStatus.Active)

    const choices = await this.getRelationshipChoices(status, true)
    if (!choices) return

    const recipientsResult = await prompts({ message: prompt, type: "select", name: "recipient", choices })

    return recipientsResult.recipient as RelationshipDTO | undefined
  }

  protected async selectRelationships(prompt: string, ...status: RelationshipStatus[]): Promise<string[] | undefined> {
    if (status.length === 0) status.push(RelationshipStatus.Active)

    const choices = await this.getRelationshipChoices(status, false)
    if (!choices) return

    const recipientsResult = await prompts({ message: prompt, type: "multiselect", name: "recipients", choices })

    const recipients = recipientsResult.recipients as string[] | undefined
    if (!recipients || recipients.length === 0) {
      console.log("No recipients selected")
      return
    }

    return recipients
  }

  private async getRelationshipChoices(status: RelationshipStatus[], returnRelationship: boolean) {
    const relationshipsResult = await this.connectorClient.relationships.getRelationships({ status })
    if (relationshipsResult.isError) {
      console.error(relationshipsResult.error)
      return
    }
    const relationships = relationshipsResult.result
    if (relationships.length === 0) {
      console.log(`No relationships with status ${new Intl.ListFormat("en", { style: "long", type: "disjunction" }).format(status.map((s) => `'${s}'`))} found`)
      return
    }

    const choices = await Promise.all(relationships.map((relationship) => this.renderRelationship(relationship, returnRelationship)))
    return choices
  }

  private async renderRelationship(relationship: RelationshipDTO, returnRelationship: boolean): Promise<prompts.Choice> {
    const value = returnRelationship ? relationship : relationship.peer
    const response = await this.connectorClient.relationships.getAttributesForRelationship(relationship.id)
    const relationshipAttributes = response.result.filter((a) => a.content.owner === relationship.peer)

    const displayName = relationshipAttributes.find((a) => a.content.value["@type"] === "DisplayName")
    if (displayName) {
      return { title: `${relationship.peer} (${(displayName.content.value as DisplayNameJSON).value})`, value }
    }

    const surname = relationshipAttributes.find((a) => a.content.value["@type"] === "Surname")
    const givenName = relationshipAttributes.find((a) => a.content.value["@type"] === "GivenName")
    if (!!surname || givenName) {
      const name = `${(givenName?.content.value as GivenNameJSON).value || ""} ${(surname?.content.value as SurnameJSON).value || ""}`.trim()
      return {
        title: `${relationship.peer} (${name})`,
        value,
      }
    }

    return { title: relationship.peer, value }
  }

  protected async selectFile(prompt: string): Promise<FileDTO | undefined> {
    const choices = await this.getFileChoices()
    if (!choices) return

    const result = await prompts({ message: prompt, type: "select", name: "file", choices })
    return result.file as FileDTO | undefined
  }

  protected async selectFiles(prompt: string): Promise<FileDTO[] | undefined> {
    const choices = await this.getFileChoices()
    if (!choices) return

    const result = await prompts({ message: prompt, type: "multiselect", name: "files", choices })
    return result.files as FileDTO[] | undefined
  }

  private async getFileChoices(): Promise<prompts.Choice[] | undefined> {
    const currentDate = DateTime.utc().toISO()
    const datesInFuture = `>=${currentDate}`

    const files = (await this.connectorClient.files.getOwnFiles({ expiresAt: datesInFuture })).result

    if (files.length === 0) {
      console.log("No appropriate files found")
      return
    }

    return files.map((f) => this.renderFile(f))
  }

  private renderFile(file: FileDTO): prompts.Choice {
    return { title: file.title ?? file.filename, value: file }
  }

  protected async selectAttribute(prompt: string, query?: GetAttributesRequest): Promise<LocalAttributeDTO | undefined> {
    const choices = await this.getAttributeChoices(query)
    if (!choices) return

    const attributesResult = await prompts({ message: prompt, type: "select", name: "attribute", choices })
    return attributesResult.attribute as LocalAttributeDTO | undefined
  }

  private async getAttributeChoices(query?: GetAttributesRequest) {
    const attributesResult = await this.connectorClient.attributes.getAttributes(query ?? {})

    if (attributesResult.isError) {
      console.error(attributesResult.error)
      return
    }

    const attributes = attributesResult.result
    if (attributes.length === 0) {
      console.log("No matching Attributes found")
      return
    }

    const choices = await Promise.all(attributes.map((attribute) => this.renderAttribute(attribute)))
    return choices
  }

  private renderAttribute(attribute: LocalAttributeDTO): prompts.Choice {
    const attributeValueType = attribute.content.value["@type"]

    const attributeValue = "value" in attribute.content.value ? attribute.content.value.value : JSON.stringify(attribute.content.value)

    return { title: `${attributeValueType}: ${attributeValue} `, value: attribute }
  }

  protected isDebugMode() {
    return this.support.configuration.debug as boolean | undefined
  }
}
