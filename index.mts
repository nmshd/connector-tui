import prompts from "prompts"
import { getAttributesOfContact } from "./lib/getAttributesOfContact.mjs"

import {
  acceptAllRelationships,
  createComplexQRCode,
  createSimpleQRCode,
  sendMessage,
  uploadFile,
} from "./lib/index.mjs"
import { sendCreateRelationshipAttributeRequest } from "./lib/sendCreateRelationshipAttributeRequest.mjs"
import { sendProposeIdentityAttributeRequest } from "./lib/sendProposeIdentityAttributeRequest.mjs"
import { sendReadIdentityAttributeRequest } from "./lib/sendReadIdentityAttributeRequest.mjs"
import { sendReadRelationshipAttributeRequest } from "./lib/sendReadRelationshipAttributeRequest.mjs"
import { sync } from "./lib/sync.mjs"

console.clear()

let running = true
while (running) {
  const result = await prompts({
    type: "select",
    name: "action",
    message: "What do you want to do?",
    choices: [
      { title: "Sync", value: 11 },
      { title: "Complex QR Code", value: 1 },
      { title: "Simple QR Code", value: 2 },
      { title: "Accept All Relationships", value: 3 },
      { title: "Upload File", value: 4 },
      { title: "Send Message", value: 5 },
      { title: "Send ReadAttributeRequest (IdentityAttributeQuery)", value: 6 },
      { title: "Send ReadAttributeRequest (RelationshipAttributeQuery)", value: 7 },
      { title: "Send CreateRelationshipAttributeRequest", value: 8 },
      { title: "Send ProposeAttributeRequest", value: 9 },
      { title: "Get Attributes of Contact", value: 10 },
      { title: "Exit", value: "exit" },
    ],
  })

  if (!result.action) break

  switch (result.action) {
    case 11:
      await sync()
      break
    case 1:
      await createComplexQRCode()
      break
    case 2:
      await createSimpleQRCode()
      break
    case 3:
      await acceptAllRelationships()
      break
    case 4:
      await uploadFile()
      break
    case 5:
      await sendMessage()
      break
    case 6:
      await sendReadIdentityAttributeRequest()
      break
    case 7:
      await sendReadRelationshipAttributeRequest()
      break
      case 8:
        await sendCreateRelationshipAttributeRequest()
        break
        case 9:
          await sendProposeIdentityAttributeRequest()
          break
          case 10:
            await getAttributesOfContact()
            break
    case "exit":
    default:
      running = false
      break
  }
}
