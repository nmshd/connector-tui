import prompts from "prompts"
import { CONNECTOR_CLIENT } from "./globals.js"

export async function sendMessage() {
  const relationships = (await CONNECTOR_CLIENT.relationships.getRelationships({})).result
  const possibleRecipients = relationships.filter((r) => r.status === "Active").map((r) => r.peer)
  if (possibleRecipients.length === 0) {
    console.log("No recipients found")
    return
  }

  const recipientChoices = possibleRecipients.map((r) => ({ title: r, value: r }))

  const existingFiles = (await CONNECTOR_CLIENT.files.getOwnFiles()).result

  const recipientsResult = await prompts({
    message: "Which recipient(s) do you want to send the message to?",
    type: "multiselect",
    name: "recipients",
    choices: recipientChoices,
  })
  const recipients = recipientsResult.recipients
  if (recipients.length === 0) {
    console.log("No recipients selected")
    return
  }

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
    {
      message: "Which file(s) do you want to send?",
      type: "multiselect",
      name: "files",
      choices: existingFiles.map((f) => ({ title: f.title, value: f.id })),
    },
  ])

  await CONNECTOR_CLIENT.messages.sendMessage({
    recipients: recipients,
    content: {
      "@type": "Mail",
      to: recipients,
      subject: result.subject,
      body: result.body,
    },
    attachments: result.files,
  })

  console.log(`Message sent to [${recipients.join(", ")}]`)
}
