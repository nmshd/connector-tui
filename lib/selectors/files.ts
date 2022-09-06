import { ConnectorFile } from "@nmshd/connector-sdk"
import prompts from "prompts"
import { CONNECTOR_CLIENT } from "../globals"

function renderFile(file: ConnectorFile): prompts.Choice {
  return { title: file.title, value: file }
}

async function getChoices(): Promise<prompts.Choice[] | undefined> {
  const files = (await CONNECTOR_CLIENT.files.getFiles()).result
  if (files.length === 0) {
    console.log("No files found")
    return
  }

  return files.map((f) => renderFile(f))
}

export async function selectFile(prompt: string): Promise<ConnectorFile | undefined> {
  const choices = await getChoices()
  if (!choices) return

  const result = await prompts({ message: prompt, type: "select", name: "file", choices: choices })
  return result.file as ConnectorFile | undefined
}

export async function selectFiles(prompt: string): Promise<string[] | undefined> {
  const choices = await getChoices()
  if (!choices) return

  const result = await prompts({ message: prompt, type: "multiselect", name: "files", choices: choices })
  return result.files as string[] | undefined
}
