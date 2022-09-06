import prompts from "prompts"
import { CONNECTOR_CLIENT } from "../globals"

export async function selectFiles(prompt: string): Promise<string[]> {
  const existingFiles = (await CONNECTOR_CLIENT.files.getOwnFiles()).result

  const result = await prompts({
    message: prompt,
    type: "multiselect",
    name: "files",
    choices: existingFiles.map((f) => ({ title: f.title, value: f.id })),
  })

  const selectedFiles = result.files as string[] | undefined
  return selectedFiles || []
}
