import prompts from "prompts"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase"

export function AddSendMail<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class SendMail extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Send Mail", value: this.sendMail })
    }

    protected async sendMail() {
      const recipients = await this.selectRelationships("Which recipient(s) do you want to send the message to?")
      if (!recipients) return

      const attachments = await this.selectFiles("Which file(s) do you want to send?")

      const result = await prompts([
        {
          message: "Whats the subject?",
          type: "text",
          name: "subject",
          initial: "A Subject",
        },
        {
          message: "Whats the body?",
          type: "text",
          name: "body",
          initial: "A Body",
        },
      ])

      const content = {
        "@type": "Mail",
        to: recipients,
        subject: result.subject,
        body: result.body,
      }

      const sendMessageResult = await this.connectorClient.messages.sendMessage({ recipients, content, attachments: attachments?.map((a) => a.id) })
      if (sendMessageResult.isError) {
        return console.error("Error while sending message", sendMessageResult.error)
      }

      console.log(`Message sent to [${recipients.join(", ")}]`)
    }
  }
}
