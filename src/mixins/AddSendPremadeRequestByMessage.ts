import { RequestJSON } from "@nmshd/content"
import prompts from "prompts"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase.js"

export function AddSendPremadeRequestByMessage<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class SendPremadeRequestByMessage extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Send Premade Request By Message", value: this.sendPremadeRequestByMessage })
    }

    protected async sendPremadeRequestByMessage() {
      const recipient = await this.selectRelationship("Which relationship do you want to send the request to?")
      if (!recipient) return console.log("No recipient selected")

      const peer = recipient.peer

      const whatRequest = await prompts({
        message: "What kind of premade request do you want to send?",
        type: "select",
        name: "requestMethod",
        choices: [
          {
            title: "Gynaecology Questionnaire",
            value: this.createGynaecologyQuestionnaire.bind(this),
          },
        ],
      })

      if (!whatRequest.requestMethod || typeof whatRequest.requestMethod !== "function") return

      const request: RequestJSON = await whatRequest.requestMethod(peer)

      const response = await this.connectorClient.outgoingRequests.createRequest({ peer, content: request })

      if (response.isError) {
        console.error("Error while creating LocalRequest", response.error)

        const details = await this.connectorClient.outgoingRequests.canCreateRequest({ peer, content: request })

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

    private createGynaecologyQuestionnaire(_: string): RequestJSON {
      const description = `Sehr geehrte Patientin,
wir begrüßen Sie herzlich in unserer Praxis.
Bitte beantworten Sie in Ruhe diese ersten Fragen,
die für eine richtige Beurteilung Ihrer Beschwerden
und die Behandlung wesentlich sind.
Selbstverständlich unterliegen alle Ihre Angaben der
ärztlichen Schweigepflicht.`

      return {
        "@type": "Request",
        description,
        items: [
          {
            "@type": "RequestItemGroup",
            title: "Persönliche Daten",
            description: "Geben Sie hier Ihre grundlegenden persönlichen Informationen ein.",
            items: [
              {
                "@type": "ReadAttributeRequestItem",
                mustBeAccepted: true,
                query: { "@type": "IdentityAttributeQuery", valueType: "GivenName" },
              },
              {
                "@type": "ReadAttributeRequestItem",
                mustBeAccepted: true,
                query: { "@type": "IdentityAttributeQuery", valueType: "Surname" },
              },
              {
                "@type": "ReadAttributeRequestItem",
                mustBeAccepted: false,
                query: { "@type": "IdentityAttributeQuery", valueType: "StreetAddress" },
              },
              {
                "@type": "ReadAttributeRequestItem",
                mustBeAccepted: false,
                description: "Geben Sie eine Festnetz- oder Mobilfunknummer an.",
                query: { "@type": "IdentityAttributeQuery", valueType: "PhoneNumber" },
              },
              {
                "@type": "ReadAttributeRequestItem",
                mustBeAccepted: false,
                query: { "@type": "IdentityAttributeQuery", valueType: "EMailAddress" },
              },
              {
                "@type": "ReadAttributeRequestItem",
                mustBeAccepted: false,
                query: { "@type": "IdentityAttributeQuery", valueType: "BirthDate" },
              },
            ],
          },
          {
            "@type": "RequestItemGroup",
            title: "Allgemeines",
            description: "In diesem Bereich werden allgemeine Informationen zu Ihrer Person und Ihrem Versichertenstatus abgefragt",
            items: [
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Ihr momentaner Hausarzt",
                settings: { "@type": "StringFormFieldSettings" },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Ihre Krankenkasse",
                settings: { "@type": "StringFormFieldSettings" },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: true,
                title: "Sind Sie privat versichert?",
                settings: { "@type": "BooleanFormFieldSettings" },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: true,
                title: "Körpergröße",
                settings: { "@type": "IntegerFormFieldSettings", unit: "cm" },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: true,
                title: "Gewicht",
                settings: { "@type": "DoubleFormFieldSettings", unit: "kg" },
              },
            ],
          },
          {
            "@type": "RequestItemGroup",
            title: "Zyklus und Schwangerschaften",
            description: "Bitte geben Sie hier alle Details zu Zyklus, Schwangerschaften und Geburten oder möglichen Komplikationen an.",
            items: [
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Wann war Ihre letzte reguläre Regelblutung?",
                description: "Wenn Ihnen das genaue Datum bekannt ist, tragen Sie es hier ein. Andernfalls können Sie im folgenden Feld alternativ einen Zeitraum nennen.",
                settings: { "@type": "DateFormFieldSettings" },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Wann war Ihre letzte reguläre Regelblutung?",
                settings: { "@type": "StringFormFieldSettings" },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "In welchem Alter hatten Sie Ihre erste Regelblutung?",
                settings: { "@type": "StringFormFieldSettings" },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Wie lange dauert Ihr Zyklus?",
                settings: { "@type": "SelectionFormFieldSettings", options: ["24 Tage", "26 Tage", "28 Tage", "30 Tage", "32 Tage", "kürzer", "länger", "unregelmäßig"] },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Anzahl Ihrer natürlichen Geburten",
                settings: { "@type": "IntegerFormFieldSettings" },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Geburtsjahre",
                settings: { "@type": "StringFormFieldSettings" },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Anzahl Ihrer Kaiserschnitte",
                settings: { "@type": "IntegerFormFieldSettings" },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Geburtsjahre",
                settings: { "@type": "StringFormFieldSettings" },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Anzahl Ihrer Saugglocken- oder Zangengeburten",
                settings: { "@type": "IntegerFormFieldSettings" },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Geburtsjahre",
                settings: { "@type": "StringFormFieldSettings" },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Anzahl Ihrer Schwangerschaftsabbrüche",
                settings: { "@type": "IntegerFormFieldSettings" },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Jahre",
                settings: { "@type": "StringFormFieldSettings" },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Gab es während der Schwangerschaft oder Geburt Komplikationen?",
                settings: { "@type": "BooleanFormFieldSettings" },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Welcher Art waren die Komplikationen?",
                settings: { "@type": "StringFormFieldSettings" },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Hatten Sie jemals eine gynäkologische Operation?",
                settings: { "@type": "BooleanFormFieldSettings" },
              },
            ],
          },
          {
            "@type": "RequestItemGroup",
            title: "Verhütung und Vorsorge",
            description: "Nennen Sie uns hier Ihre Verhütungsmethoden und Ihre erfolgten Vorsorgemaßnahmen.",
            items: [
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Wurde eine HPV-Impfung gegen Gebärmutterhalskrebs durchgeführt?",
                settings: { "@type": "BooleanFormFieldSettings" },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Mit welcher Methode verhüten Sie?",
                settings: {
                  "@type": "SelectionFormFieldSettings",
                  allowMultipleSelection: true,
                  options: [
                    "keine",
                    "Verhütungsstäbchen (Implanon)",
                    "Sterilisation",
                    "3-Monats-Spritze",
                    "Hormonspirae (Mirena, Jaydess)",
                    "Sterilisation des Partners",
                    "Pflaster",
                    "Kondom",
                    "Kupferspirale",
                    "Nuvaring",
                    "Pille",
                  ],
                },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Name der Pille",
                description: "Wenn Sie mit der Pille verhüten, tragen Sie hier bitte den Namen ein.",
                settings: { "@type": "StringFormFieldSettings" },
              },
            ],
          },
          {
            "@type": "RequestItemGroup",
            title: "Bekannte Erkrankungen und Infektionen",
            description: "Nennen Sie uns alle Ihnen bekannten Erkrankungen oder Infektionen, die Sie in der Vergangenheit hatten.",
            items: [
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Haben oder hatten Sie eine der folgenden Erkrankungen oder Infektionen?",
                settings: {
                  "@type": "SelectionFormFieldSettings",
                  allowMultipleSelection: true,
                  options: [
                    "Gerinnungsstörung",
                    "Bluthochdruck",
                    "Herzinfarkt",
                    "Diabetes mellitus",
                    "HIV",
                    "Hormonstörung",
                    "Arthrose",
                    "Asthma/COPD",
                    "Thrombose",
                    "Lebererkrankung",
                    "Epilepsie",
                    "Schilddrüsenerkrankung",
                    "Wechseljahrsbeschwerden",
                    "Krebserkrankungen",
                    "Schlaganfall",
                    "Migräne",
                    "Nierenerkrankung",
                    "Blutungsneigung",
                    "Hepatitis",
                    "Krampfadern",
                    "Harninkontinenz",
                    "Osteoporose",
                  ],
                },
              },
            ],
          },
          {
            "@type": "RequestItemGroup",
            title: "Abschließendes und Einwilligungen",
            description: "Bestätigen Sie abschließend die Richtigkeit Ihrer Angaben und geben Sie uns Einwilligungen.",
            items: [
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Wie finden Sie die Zeitschriftenauswahl in unserem Wartezimmer?",
                description: "1 = sehr schlecht, 10 = sehr gut",
                settings: { "@type": "RatingFormFieldSettings", maxRating: 10 },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Wie zufrieden waren Sie mit dem Ablauf der Terminvereinbarung?",
                description: "Vergeben Sie bis zu 5 Sterne, ein Stern bedeutet sehr unzufrieden, 5 Sterne vollstens zufrieden.",
                settings: { "@type": "RatingFormFieldSettings", maxRating: 5 },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: false,
                title: "Wie haben Sie von unserer Praxis erfahren?",
                settings: { "@type": "SelectionFormFieldSettings", options: ["Hausarzt", "Internet", "von Bekannten", "zufällig", "sonstiges"] },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: true,
                title: "Dürfen wir Ihnen Informationen zu unserer Praxis per E-Mail zusenden? ",
                settings: { "@type": "BooleanFormFieldSettings" },
              },
              {
                "@type": "FormFieldRequestItem",
                mustBeAccepted: true,
                title: "Falls nötig bin ich damit einverstanden, dass Arztberichte an meine behandelnden Ärzte geschickt werden.",
                settings: { "@type": "BooleanFormFieldSettings" },
              },
              {
                "@type": "ConsentRequestItem",
                mustBeAccepted: true,
                title: "Bestätigung",
                consent: "Ich bestätige hiermit die Richtigkeit und Vollständigkeit meiner Angaben.",
              },
            ],
          },
        ],
      }
    }
  }
}
