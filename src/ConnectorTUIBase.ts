import {
  ConnectorAttribute,
  ConnectorClient,
  ConnectorFile,
  ConnectorRelationship,
  ConnectorRelationshipStatus,
  ConnectorSupportInformation,
  GetAttributesRequest,
} from "@nmshd/connector-sdk"
import { DisplayNameJSON, GivenNameJSON, SurnameJSON } from "@nmshd/content"
import prompts from "prompts"
import { IdentityDeletionProcessEndpoint } from "./IdentityDeletionProcessEndpoint.js"

export type ConnectorTUIBaseConstructor = new (...args: any[]) => ConnectorTUIBase

export interface ConnectorTUIChoice extends prompts.Choice {
  value(): Promise<void>
}

export class ConnectorTUIBase {
  protected choices: ConnectorTUIChoice[] = []
  protected choicesInDeletion: ConnectorTUIChoice[] = []
  protected identityDeletionProcessEndpoint: IdentityDeletionProcessEndpoint

  public constructor(
    protected connectorClient: ConnectorClient,
    protected connectorAddress: string,
    protected support: ConnectorSupportInformation
  ) {
    this.identityDeletionProcessEndpoint = new IdentityDeletionProcessEndpoint(this.connectorClient.account["httpClient"])
  }

  protected async selectRelationship(prompt: string, ...status: ConnectorRelationshipStatus[]): Promise<ConnectorRelationship | undefined> {
    if (status.length === 0) status.push(ConnectorRelationshipStatus.Active)

    const choices = await this.getRelationshipChoices(status, true)
    if (!choices) return

    const recipientsResult = await prompts({ message: prompt, type: "select", name: "recipient", choices })

    return recipientsResult.recipient as ConnectorRelationship | undefined
  }

  protected async selectRelationships(prompt: string, ...status: ConnectorRelationshipStatus[]): Promise<string[] | undefined> {
    if (status.length === 0) status.push(ConnectorRelationshipStatus.Active)

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

  private async getRelationshipChoices(status: ConnectorRelationshipStatus[], returnRelationship: boolean) {
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

  private async renderRelationship(relationship: ConnectorRelationship, returnRelationship: boolean): Promise<prompts.Choice> {
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
      const name = `${(surname?.content.value as SurnameJSON).value || ""} ${(givenName?.content.value as GivenNameJSON).value || ""}`.trim()
      return {
        title: `${relationship.peer} (${name})`,
        value,
      }
    }

    return { title: relationship.peer, value }
  }

  protected async selectFile(prompt: string): Promise<ConnectorFile | undefined> {
    const choices = await this.getFileChoices()
    if (!choices) return

    const result = await prompts({ message: prompt, type: "select", name: "file", choices })
    return result.file as ConnectorFile | undefined
  }

  protected async selectFiles(prompt: string): Promise<ConnectorFile[] | undefined> {
    const choices = await this.getFileChoices()
    if (!choices) return

    const result = await prompts({ message: prompt, type: "multiselect", name: "files", choices })
    return result.files as ConnectorFile[] | undefined
  }

  private async getFileChoices(): Promise<prompts.Choice[] | undefined> {
    const files = (await this.connectorClient.files.getOwnFiles()).result
    if (files.length === 0) {
      console.log("No files found")
      return
    }

    return files.map((f) => this.renderFile(f))
  }

  private renderFile(file: ConnectorFile): prompts.Choice {
    return { title: file.title, value: file }
  }

  protected async selectAttribute(prompt: string, query?: GetAttributesRequest): Promise<ConnectorAttribute | undefined> {
    const choices = await this.getAttributeChoices(query)
    if (!choices) return

    const attributesResult = await prompts({ message: prompt, type: "select", name: "attribute", choices })
    return attributesResult.attribute as ConnectorAttribute | undefined
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

  private renderAttribute(attribute: ConnectorAttribute): prompts.Choice {
    const attributeValueType = attribute.content.value["@type"]

    const attributeValue = "value" in attribute.content.value ? attribute.content.value.value : JSON.stringify(attribute.content.value)

    return { title: `${attributeValueType}: ${attributeValue} `, value: attribute }
  }

  protected isDebugMode() {
    return this.support.configuration.debug as boolean | undefined
  }
}
