import prompts from "prompts"
import { CONNECTOR_CLIENT } from "./globals"
import { selectFiles, selectRelationships } from "./selectors"

export async function sendMail() {
  const recipients = await selectRelationships("Which recipient(s) do you want to send the message to?")
  if (!recipients) return

  const attachments = await selectFiles("Which file(s) do you want to send?")

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

  const sendMessageResult = await CONNECTOR_CLIENT.messages.sendMessage({ recipients, content, attachments })
  if (sendMessageResult.isError) {
    return console.error("Error while sending message", sendMessageResult.error)
  }

  console.log(`Message sent to [${recipients.join(", ")}]`)
}
