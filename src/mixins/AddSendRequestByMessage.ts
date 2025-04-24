import {
  AuthenticationRequestItemJSON,
  ConsentRequestItemJSON,
  CreateAttributeRequestItemJSON,
  FormFieldRequestItemJSON,
  FreeTextRequestItemJSON,
  ProposeAttributeRequestItemJSON,
  ReadAttributeRequestItemJSON,
  RegisterAttributeListenerRequestItemJSON,
  RelationshipAttributeConfidentiality,
  RequestItemGroupJSON,
  RequestItemJSON,
  ShareAttributeRequestItemJSON,
  TransferFileOwnershipRequestItemJSON,
} from "@nmshd/content"
import prompts from "prompts"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase.js"

export function AddSendRequestByMessage<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class SendRequestByMessage extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Send Request By Message", value: this.sendRequestByMessage })
    }

    protected async sendRequestByMessage() {
      const recipient = await this.selectRelationship("Which relationship do you want to send the request to?")
      if (!recipient) return console.log("No recipient selected")

      const peer = recipient.peer

      const requestItems: (RequestItemJSON | RequestItemGroupJSON)[] = []

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition,no-constant-condition
      while (true) {
        const whatRequest = await prompts({
          message: "What kind of request do you want to send?",
          type: "select",
          name: "requestMethod",
          choices: [
            {
              title: "ReadAttributeRequestItem",
              value: this.createReadAttributeRequestItem.bind(this),
            },
            {
              title: "IQLReadAttributeRequestItem",
              value: this.createIQLReadAttributeRequestItem.bind(this),
            },
            {
              title: "ProposeAttributeRequestItem",
              value: this.createProposeAttributeRequestItem.bind(this),
            },
            {
              title: "ProposeAttributeRequestItem with RelationshipAttribute",
              value: this.createProposeRelationshipAttributeRequestItem.bind(this),
            },
            {
              title: "IQLProposeAttributeRequestItem",
              value: this.createIQLProposeAttributeRequestItem.bind(this),
            },
            {
              title: "CreateRelationshipAttributeRequestItem",
              value: this.createCreateRelationshipAttributeRequestItem.bind(this),
            },
            {
              title: "CreateRelationshipAttributeRequestItem with Boolean value",
              value: this.createCreateRelationshipAttributeRequestItemWithBooleanValue.bind(this),
            },
            {
              title: "CreateIdentityAttributeRequestItem",
              value: this.createCreateIdentityAttributeRequestItem.bind(this),
            },
            {
              title: "ConsentRequestItem",
              value: this.createConsentRequestItem.bind(this),
            },
            {
              title: "RegisterAttributeListenerRequestItem",
              value: this.createRegisterAttributeListenerRequestItem.bind(this),
            },
            {
              title: "AuthenticationRequestItem",
              value: this.createAuthenticationRequestItem.bind(this),
            },
            {
              title: "FormFieldRequestItem",
              value: this.createFormFieldRequestItem.bind(this),
            },
            {
              title: "FreeTextRequestItem",
              value: this.createFreeTextRequestItem.bind(this),
            },
            {
              title: "ShareAttributeRequestItem",
              value: this.createShareAttributeRequestItem.bind(this),
            },
            {
              title: "TransferFileOwnershipRequestItem",
              value: this.createTransferFileOwnershipRequestItem.bind(this),
            },
            {
              title: "No more items please",
              value: "no-more",
            },
          ],
        })

        if (!whatRequest.requestMethod) return

        if (typeof whatRequest.requestMethod !== "function") {
          break
        }

        const requestItemJSON = await whatRequest.requestMethod(peer)
        if (requestItemJSON) requestItems.push(requestItemJSON)
      }

      if (requestItems.length === 0) {
        console.error("You have to add at least one item.")
        return
      }

      const response = await this.connectorClient.outgoingRequests.createRequest({
        peer,
        content: {
          title: "The title of the Request",
          description: "The description of the Request",
          items: requestItems,
        },
      })

      if (response.isError) {
        console.error("Error while creating LocalRequest", response.error)

        const details = await this.connectorClient.outgoingRequests.canCreateRequest({
          peer,
          content: {
            title: "The title of the Request",
            description: "The description of the Request",
            items: requestItems,
          },
        })

        console.log("Details: ", details.result)

        return
      }

      const messageResponse = await this.connectorClient.messages.sendMessage({
        recipients: [peer],
        content: response.result.content,
      })

      if (messageResponse.isError) {
        return console.error("Error while sending message", messageResponse.error)
      }

      console.log("The following Request was sent:", JSON.stringify(response.result.content, null, 2))

      console.log(`Request sent to '${peer}'`)
    }

    private async createReadAttributeRequestItem() {
      const whatAttribute = await prompts({
        message: "What kind of Attribute do you want to read?",
        type: "select",
        name: "attributeType",
        choices: [
          {
            title: "Identity Attribute",
            value: "IdentityAttribute",
          },
          {
            title: "Relationship Attribute",
            value: "RelationshipAttribute",
          },
          {
            title: "Third Party Relationship Attribute",
            value: "ThirdPartyRelationshipAttribute",
          },
        ],
      })

      switch (whatAttribute.attributeType) {
        case "IdentityAttribute":
          return await this.createReadIdentityAttributeRequestItem()
        case "RelationshipAttribute":
          return await this.createReadRelationshipAttributeRequestItem()
        case "ThirdPartyRelationshipAttribute":
          return await this.createReadThirdPartyRelationshipAttributeRequestItem()
        default:
          return console.log("Invalid attribute type")
      }
    }

    private async createReadRelationshipAttributeRequestItem() {
      const result = await prompts([
        {
          message: "What's the attribute type you would like to query?",
          type: "text",
          name: "attributeType",
        },
        {
          message: "What's the title of the RelationshipAttribute?",
          type: "text",
          name: "attributeTitle",
          initial: "Attribute Title",
        },
        {
          message: "What's the description of the RelationshipAttribute?",
          type: "text",
          name: "attributeDescription",
          initial: "Attribute Title",
        },
        {
          message: "What's the key of the attribute you would like to query?",
          type: "text",
          name: "key",
          initial: "Key of RelationshipAttribute",
        },
        {
          message: "Who is the owner of the RelationshipAttribute?",
          type: "select",
          name: "owner",
          choices: [
            { title: "The other side or a third party", value: "" },
            { title: "The other side", value: "recipient" },
            { title: "A third party", value: "thirdParty" },
          ],
        },
        {
          message: "What are the third party addresses? (comma-separated, optional)",
          type: "text",
          name: "thirdParties",
        },
      ])
      const title = result.attributeTitle ?? `A ${result.attributeType} attribute`

      const requestItem: ReadAttributeRequestItemJSON = {
        "@type": "ReadAttributeRequestItem",
        mustBeAccepted: true,
        query: {
          "@type": "RelationshipAttributeQuery",
          owner: result.owner ?? "",
          attributeCreationHints: {
            title,
            description: result.attributeDescription,
            confidentiality: RelationshipAttributeConfidentiality.Public,
            valueType: result.attributeType,
          },
          key: result.key,
        },
      }

      return requestItem
    }

    private async createReadThirdPartyRelationshipAttributeRequestItem() {
      const result = await prompts([
        {
          message: "What's the attribute type you would like to query?",
          type: "text",
          name: "attributeType",
        },
        {
          message: "What's the key of the attribute you would like to query?",
          type: "text",
          name: "key",
          initial: "Key of RelationshipAttribute",
        },
        {
          message: "Who is the owner of the RelationshipAttribute?",
          type: "text",
          name: "owner",
        },
        {
          message: "What are the third party addresses? (comma-separated)",
          type: "text",
          name: "thirdParties",
        },
      ])

      const thirdParties = result.thirdParties
        .split(",")
        .map((address: string) => address.trim())
        .filter((address: string) => address.length > 0)

      const requestItem: ReadAttributeRequestItemJSON = {
        "@type": "ReadAttributeRequestItem",
        mustBeAccepted: true,
        query: {
          "@type": "ThirdPartyRelationshipAttributeQuery",
          owner: result.owner ?? "",
          key: result.key,
          thirdParty: thirdParties,
        },
      }

      return requestItem
    }

    private async createIQLReadAttributeRequestItem() {
      const result = await prompts([
        {
          message: "Type in the IQL query string",
          type: "text",
          name: "queryString",
        },
        {
          message: "Type in the IQL query valueType fallback",
          type: "text",
          name: "valueType",
        },
      ])

      const requestItem: ReadAttributeRequestItemJSON = {
        "@type": "ReadAttributeRequestItem",
        mustBeAccepted: true,
        query: {
          "@type": "IQLQuery",
          queryString: result.queryString,
          attributeCreationHints: {
            valueType: result.valueType,
          },
        },
      }

      return requestItem
    }

    private async createReadIdentityAttributeRequestItem() {
      const result = await prompts([
        {
          message: "What's the attribute type you would like to query?",
          type: "text",
          name: "attributeType",
        },
      ])

      const requestItem: ReadAttributeRequestItemJSON = {
        "@type": "ReadAttributeRequestItem",
        mustBeAccepted: true,
        query: {
          "@type": "IdentityAttributeQuery",
          valueType: result.attributeType,
        },
      }

      return requestItem
    }

    private async createProposeAttributeRequestItem() {
      const result = await prompts([
        {
          message: "What's the attribute type you would like to create?",
          type: "text",
          name: "attributeType",
        },
        {
          message: "What's the value of your Attribute?",
          type: "text",
          name: "value",
        },
      ])

      const requestItem: ProposeAttributeRequestItemJSON = {
        "@type": "ProposeAttributeRequestItem",
        mustBeAccepted: true,
        query: {
          "@type": "IdentityAttributeQuery",
          valueType: result.attributeType,
        },
        attribute: {
          "@type": "IdentityAttribute",
          owner: "",
          value: {
            "@type": result.attributeType,
            value: result.value,
          },
        },
      }

      return requestItem
    }

    private async createProposeRelationshipAttributeRequestItem() {
      const result = await prompts([
        {
          message: "What's the title of your Attribute?",
          type: "text",
          name: "title",
        },
        {
          message: "What's the value of your Attribute?",
          type: "text",
          name: "value",
        },
      ])

      const requestItem: ProposeAttributeRequestItemJSON = {
        "@type": "ProposeAttributeRequestItem",
        mustBeAccepted: true,
        query: {
          "@type": "RelationshipAttributeQuery",
          attributeCreationHints: {
            title: result.title,
            confidentiality: RelationshipAttributeConfidentiality.Public,
            valueType: "ProprietaryString",
          },
          key: "aKey",
          owner: "",
        },
        attribute: {
          "@type": "RelationshipAttribute",
          owner: "",
          key: "aKey",
          confidentiality: RelationshipAttributeConfidentiality.Public,
          value: {
            "@type": "ProprietaryString",
            title: result.title,
            value: result.value,
          },
        },
      }

      return requestItem
    }

    private async createIQLProposeAttributeRequestItem() {
      const result = await prompts([
        {
          message: "Type in the IQL query string",
          type: "text",
          name: "queryString",
        },
        {
          message: "What's the attribute type you would like to create?",
          type: "text",
          name: "attributeType",
        },
        {
          message: "What's the value of your Attribute?",
          type: "text",
          name: "value",
        },
      ])

      const requestItem: ProposeAttributeRequestItemJSON = {
        "@type": "ProposeAttributeRequestItem",
        mustBeAccepted: true,
        query: {
          "@type": "IQLQuery",
          queryString: result.queryString,
        },
        attribute: {
          "@type": "IdentityAttribute",
          owner: "",
          value: {
            "@type": result.attributeType,
            value: result.value,
          },
        },
      }

      return requestItem
    }

    private async createCreateRelationshipAttributeRequestItem() {
      const result = await prompts([
        {
          message: "What's the title of the RelationshipAttribute you would like to create?",
          type: "text",
          name: "title",
          initial: "Title of RelationshipAttribute",
        },
        {
          message: "What's the key of the RelationshipAttribute you would like to create?",
          type: "text",
          name: "key",
          initial: "Key of RelationshipAttribute",
        },
        {
          message: "What's the value of your Attribute?",
          type: "text",
          name: "value",
        },
      ])

      const requestItem: CreateAttributeRequestItemJSON = {
        "@type": "CreateAttributeRequestItem",
        mustBeAccepted: true,
        attribute: {
          "@type": "RelationshipAttribute",
          owner: "",
          key: result.key,
          confidentiality: RelationshipAttributeConfidentiality.Public,
          value: {
            "@type": "ProprietaryString",
            value: result.value,
            title: result.title,
          },
        },
      }

      return requestItem
    }

    private async createCreateRelationshipAttributeRequestItemWithBooleanValue() {
      const result = await prompts([
        {
          message: "What's the title of the RelationshipAttribute you would like to create?",
          type: "text",
          name: "title",
          initial: "Title of RelationshipAttribute",
        },
        {
          message: "What's the key of the RelationshipAttribute you would like to create?",
          type: "text",
          name: "key",
          initial: "Key of RelationshipAttribute",
        },
        {
          message: "What's the value of your Boolean Attribute?",
          type: "toggle",
          name: "value",
        },
        {
          message: "Who will be the owner of the RelationshipAttribute?",
          type: "select",
          name: "owner",
          choices: [
            { title: "You (Connector)", value: this.connectorAddress },
            { title: "The other Side", value: "" },
          ],
        },
      ])

      const requestItem: CreateAttributeRequestItemJSON = {
        "@type": "CreateAttributeRequestItem",
        mustBeAccepted: true,
        attribute: {
          "@type": "RelationshipAttribute",
          owner: result.owner,
          key: result.key,
          confidentiality: RelationshipAttributeConfidentiality.Public,
          isTechnical: true,
          value: {
            "@type": "ProprietaryBoolean",
            value: result.value,
            title: result.title,
          },
        },
      }

      return requestItem
    }

    private async createCreateIdentityAttributeRequestItem(peer: string) {
      const result = await prompts([
        {
          message: "What's the value type of the IdentityAttribute you would like to create?",
          type: "text",
          name: "valueType",
        },
        {
          message: "What's the value of the Attribute?",
          type: "text",
          name: "value",
        },
      ])

      const requestItem: CreateAttributeRequestItemJSON = {
        "@type": "CreateAttributeRequestItem",
        mustBeAccepted: true,
        attribute: {
          "@type": "IdentityAttribute",
          owner: peer,
          value: {
            "@type": result.valueType,
            value: result.value,
          },
        },
      }

      return requestItem
    }

    private async createConsentRequestItem() {
      const result = await prompts([
        {
          message: "What's the consent the peer should agree to?",
          type: "text",
          name: "consent",
          format: (value: string) => value.replaceAll("\\n", "\n"),
          validate: (value: string) => (value.length < 1 ? "Consent must not be empty" : true),
        },
        {
          message: "[Optional] Enter a description for the consent",
          type: "text",
          name: "description",
          format: (value: string) => (value.length > 0 ? value.replaceAll("\\n", "\n") : undefined),
        },
        {
          message: "Does the consent have to be accepted?",
          type: "confirm",
          name: "mustBeAccepted",
          initial: true,
        },
        {
          message: "Do you want to require a manual decision?",
          type: "confirm",
          name: "requireManualDecision",
          initial: false,
        },
        {
          message: "[Optional] Enter the URL to to the consent details?",
          type: "text",
          name: "link",
          format: (value) => (value.length > 0 ? value : undefined),
        },
        {
          message: "[Optional] Enter a link display text",
          type: "text",
          name: "linkDisplayText",
          format: (value) => (value.length > 0 ? value : undefined),
        },
        {
          message: "[Optional] Enter a consentKey to know which consent the user agreed to",
          type: "text",
          name: "responseMetadata",
          format: (value) => (value.length > 0 ? { consentKey: value } : undefined),
        },
      ])

      const requestItem: ConsentRequestItemJSON = {
        "@type": "ConsentRequestItem",
        mustBeAccepted: result.mustBeAccepted,
        requireManualDecision: result.requireManualDecision,
        consent: result.consent,
        description: result.description,
        link: result.link,
        linkDisplayText: result.link ? result.linkDisplayText : undefined,
        metadata: result.responseMetadata,
      }

      return requestItem
    }

    private async createRegisterAttributeListenerRequestItem() {
      const result = await prompts([
        {
          message: "What's the attribute type you would like to query?",
          type: "text",
          name: "attributeType",
        },
      ])

      const requestItem: RegisterAttributeListenerRequestItemJSON = {
        "@type": "RegisterAttributeListenerRequestItem",
        mustBeAccepted: true,
        query: {
          "@type": "IdentityAttributeQuery",
          valueType: result.attributeType,
        },
      }

      return requestItem
    }

    private async createAuthenticationRequestItem() {
      const result = await prompts([
        {
          message: "Enter a title of the authentication",
          type: "text",
          name: "title",
        },
        {
          message: "[Optional] Enter an unique authenticationToken to know which authentication did the user grant",
          type: "text",
          name: "responseMetadata",
          format: (value) => (value.length > 0 ? { authenticationToken: value } : undefined),
        },
      ])

      const requestItem: AuthenticationRequestItemJSON = {
        "@type": "AuthenticationRequestItem",
        mustBeAccepted: true,
        title: result.title,
        metadata: result.responseMetadata,
      }

      return requestItem
    }

    private async createFormFieldRequestItem() {
      const result = await prompts([
        {
          message: "Enter a title for the form field",
          type: "text",
          name: "title",
        },
        {
          message: "What kind of form field should be created?",
          type: "select",
          name: "settings",
          choices: [
            {
              title: "Boolean form field",
              value: "BooleanFormFieldSettings",
            },
            {
              title: "Date form field",
              value: "DateFormFieldSettings",
            },
            {
              title: "Double form field",
              value: "DoubleFormFieldSettings",
            },
            {
              title: "Integer form field",
              value: "IntegerFormFieldSettings",
            },
            {
              title: "Rating form field",
              value: "RatingFormFieldSettings",
            },
            {
              title: "Selection form field",
              value: "SelectionFormFieldSettings",
            },
            {
              title: "String form field",
              value: "StringFormFieldSettings",
            },
          ],
        },
      ])

      switch (result.settings) {
        case "BooleanFormFieldSettings":
          return this.createBooleanFormFieldRequestItem(result.title)
        case "DateFormFieldSettings":
          return this.createDateFormFieldRequestItem(result.title)
        case "DoubleFormFieldSettings":
          return await this.createDoubleFormFieldRequestItem(result.title)
        case "IntegerFormFieldSettings":
          return await this.createIntegerFormFieldRequestItem(result.title)
        case "RatingFormFieldSettings":
          return await this.createRatingFormFieldRequestItem(result.title)
        case "SelectionFormFieldSettings":
          return await this.createSelectionFormFieldRequestItem(result.title)
        case "StringFormFieldSettings":
          return await this.createStringFormFieldRequestItem(result.title)
        default:
          return console.log("Invalid form field settings")
      }
    }

    private createBooleanFormFieldRequestItem(title: string) {
      const requestItem: FormFieldRequestItemJSON = {
        "@type": "FormFieldRequestItem",
        mustBeAccepted: true,
        title,
        settings: {
          "@type": "BooleanFormFieldSettings",
        },
      }

      return requestItem
    }

    private createDateFormFieldRequestItem(title: string) {
      const requestItem: FormFieldRequestItemJSON = {
        "@type": "FormFieldRequestItem",
        mustBeAccepted: true,
        title,
        settings: {
          "@type": "DateFormFieldSettings",
        },
      }

      return requestItem
    }

    private async createDoubleFormFieldRequestItem(title: string) {
      const maxNumberOfDecimalDigits = 16

      const result = await prompts([
        {
          message: "[Optional] Enter the name of the unit of the requested double",
          type: "text",
          name: "unit",
          format: (value) => (value.length > 0 ? value : undefined),
        },
        {
          message: "[Optional] Enter a number as lower limit for the requested double",
          type: "number",
          float: true,
          round: maxNumberOfDecimalDigits,
          name: "min",
          format: (value) => (typeof value === "number" ? value : undefined),
        },
        {
          message: "[Optional] Enter a number as upper limit for the requested double",
          type: "number",
          float: true,
          round: maxNumberOfDecimalDigits,
          name: "max",
          format: (value) => (typeof value === "number" ? value : undefined),
        },
      ])

      const requestItem: FormFieldRequestItemJSON = {
        "@type": "FormFieldRequestItem",
        mustBeAccepted: true,
        title,
        settings: {
          "@type": "DoubleFormFieldSettings",
          unit: result.unit,
          min: result.min,
          max: result.max,
        },
      }

      return requestItem
    }

    private async createIntegerFormFieldRequestItem(title: string) {
      const result = await prompts([
        {
          message: "[Optional] Enter the name of the unit of the requested integer",
          type: "text",
          name: "unit",
          format: (value) => (value.length > 0 ? value : undefined),
        },
        {
          message: "[Optional] Enter an integer as lower limit for the requested integer",
          type: "number",
          name: "min",
          format: (value) => (typeof value === "number" ? value : undefined),
          validate: (value) => (Number.isInteger(value) ? true : "The min must be an integer"),
        },
        {
          message: "[Optional] Enter an integer as upper limit for the requested integer",
          type: "number",
          name: "max",
          format: (value) => (typeof value === "number" ? value : undefined),
          validate: (value) => (Number.isInteger(value) ? true : "The max must be an integer"),
        },
      ])

      const requestItem: FormFieldRequestItemJSON = {
        "@type": "FormFieldRequestItem",
        mustBeAccepted: true,
        title,
        settings: {
          "@type": "IntegerFormFieldSettings",
          unit: result.unit,
          min: result.min,
          max: result.max,
        },
      }

      return requestItem
    }

    private async createRatingFormFieldRequestItem(title: string) {
      const result = await prompts({
        message: "Enter an integer from five to ten as upper limit for the requested rating",
        type: "number",
        name: "maxRating",
        validate: (value) => (Number.isInteger(value) && value >= 5 && value <= 10 ? true : "The maxRating must be an integer from five to ten"),
      })

      const requestItem: FormFieldRequestItemJSON = {
        "@type": "FormFieldRequestItem",
        mustBeAccepted: true,
        title,
        settings: {
          "@type": "RatingFormFieldSettings",
          maxRating: result.maxRating,
        },
      }

      return requestItem
    }

    private async createSelectionFormFieldRequestItem(title: string) {
      const parseOptions = (input: string) =>
        input
          .split(",")
          .map((option: string) => option.trim())
          .filter((option: string) => option.length > 0)

      const result = await prompts([
        {
          message: "Which options can be selected? (comma-separated)",
          type: "text",
          name: "options",
          format: (value) => (parseOptions(value).length > 0 ? parseOptions(value) : undefined),
          validate: (value) => (parseOptions(value).length > 0 ? true : "At least one option must be provided"),
        },
        {
          message: "[Optional] Should multiple selection be allowed?",
          type: "confirm",
          name: "allowMultipleSelection",
          initial: false,
        },
      ])

      const allowMultipleSelection = result.allowMultipleSelection ? true : undefined

      const requestItem: FormFieldRequestItemJSON = {
        "@type": "FormFieldRequestItem",
        mustBeAccepted: true,
        title,
        settings: {
          "@type": "SelectionFormFieldSettings",
          options: result.options,
          allowMultipleSelection,
        },
      }

      return requestItem
    }

    private async createStringFormFieldRequestItem(title: string) {
      const result = await prompts([
        {
          message: "[Optional] Should newlines be allowed?",
          type: "confirm",
          name: "allowNewlines",
          initial: false,
        },
        {
          message: "[Optional] Enter a non-negative integer as lower limit for the length of the requested string",
          type: "number",
          name: "min",
          format: (value) => (typeof value === "number" ? value : undefined),
          validate: (value) => (Number.isInteger(value) && value > 0 ? true : "The min must be a non-negative integer"),
        },
        {
          message: "[Optional] Enter a non-negative integer as upper limit for the length of the requested string",
          type: "number",
          name: "max",
          format: (value) => (typeof value === "number" ? value : undefined),
          validate: (value) => (Number.isInteger(value) && value > 0 ? true : "The max must be a non-negative integer"),
        },
      ])

      const allowNewlines = result.allowNewlines ? true : undefined

      const requestItem: FormFieldRequestItemJSON = {
        "@type": "FormFieldRequestItem",
        mustBeAccepted: true,
        title,
        settings: {
          "@type": "StringFormFieldSettings",
          allowNewlines,
          min: result.min,
          max: result.max,
        },
      }

      return requestItem
    }

    private async createFreeTextRequestItem() {
      const result = await prompts([
        {
          message: "Enter a free text",
          type: "text",
          name: "freeText",
        },
      ])

      const requestItem: FreeTextRequestItemJSON = {
        "@type": "FreeTextRequestItem",
        mustBeAccepted: true,
        freeText: result.freeText,
      }

      return requestItem
    }

    private async createShareAttributeRequestItem() {
      const query = { content: { "@type": "IdentityAttribute", owner: this.connectorAddress }, shareInfo: { peer: "!" }, succeededBy: "!" }

      const attribute = await this.selectAttribute("Which Attribute would you like to share?", query)
      if (!attribute) return

      const requestItem: ShareAttributeRequestItemJSON = {
        "@type": "ShareAttributeRequestItem",
        mustBeAccepted: true,
        sourceAttributeId: attribute.id,
        attribute: attribute.content,
      }

      return requestItem
    }

    private async createTransferFileOwnershipRequestItem() {
      const file = await this.selectFile("The ownership of which File do you want to transfer?")
      if (!file) return

      const result = await prompts({
        name: "requireManualDecision",
        message: "Do you want to require a manual decision?",
        initial: false,
        type: "confirm",
      })

      const requestItem: TransferFileOwnershipRequestItemJSON = {
        "@type": "TransferFileOwnershipRequestItem",
        mustBeAccepted: true,
        requireManualDecision: result.requireManualDecision,
        fileReference: file.truncatedReference,
      }

      return requestItem
    }
  }
}
