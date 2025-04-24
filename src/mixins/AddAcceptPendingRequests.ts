import { ConnectorRequestStatus, DecideRequestItem, DecideRequestItemGroup } from "@nmshd/connector-sdk"
import { RequestItemGroupJSON } from "@nmshd/content"
import { DateTime } from "luxon"
import prompts from "prompts"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase.js"

export function AddAcceptPendingRequests<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class AcceptPendingRequests extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Accept Pending Requests", value: this.acceptPendingRequests })
    }

    protected async acceptPendingRequests() {
      const result = await prompts({
        message: "Do you want to sync before accepting pending requests?",
        type: "confirm",
        name: "sync",
      })

      if (result.sync) {
        await this.connectorClient.account.sync()
      }

      const pendingRequests = (
        await this.connectorClient.incomingRequests.getRequests({
          status: ConnectorRequestStatus.ManualDecisionRequired,
        })
      ).result

      for (const request of pendingRequests) {
        const title = request.content.title ? `title ${request.content.title}` : "no title"
        console.log(`Trying to accept request ${request.id} with ${title}...`)
        const items: (DecideRequestItem | DecideRequestItemGroup)[] = []
        for (const item of request.content.items) {
          if (item["@type"] === "RequestItemGroup") {
            const acceptItems: DecideRequestItem[] = []
            for (const _itemOfGroup of (item as RequestItemGroupJSON).items) {
              if (_itemOfGroup["@type"] === "FreeTextRequestItem") {
                acceptItems.push({ accept: true, freeText: "freeText" } as DecideRequestItem)
              } else if (_itemOfGroup["@type"] === "DeleteAttributeRequestItem") {
                acceptItems.push({ accept: true, deletionDate: DateTime.utc().plus({ seconds: 5 }).toISO() } as DecideRequestItem)
              } else {
                acceptItems.push({ accept: true })
              }
            }
            items.push({ items: acceptItems })
          } else if (item["@type"] === "FreeTextRequestItem") {
            items.push({ accept: true, freeText: "freeText" } as DecideRequestItem)
          } else if (item["@type"] === "DeleteAttributeRequestItem") {
            items.push({ accept: true, deletionDate: DateTime.utc().plus({ seconds: 5 }).toISO() } as DecideRequestItem)
          } else {
            items.push({ accept: true })
          }
        }

        const canAcceptResult = await this.connectorClient.incomingRequests.canAccept(request.id, { items })
        if (canAcceptResult.isError) {
          console.log(canAcceptResult.error)
          return
        }

        if (!canAcceptResult.result.isSuccess) {
          console.log("Cannot accept request")
          console.log(canAcceptResult.result)
          return
        }

        const acceptResult = await this.connectorClient.incomingRequests.accept(request.id, { items })
        if (acceptResult.isError) {
          console.log(acceptResult.error)
          return
        }
      }
    }
  }
}
