import { ConnectorRequestStatus, DecideRequestItem, DecideRequestItemGroup } from "@nmshd/connector-sdk"
import prompts from "prompts"
import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase"

export function AddAcceptPendingRequests<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class Sync extends Base {
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const _itemOfGroup of item.items) {
              acceptItems.push({ accept: true })
            }
            items.push({ items: acceptItems })
          } else {
            items.push({ accept: true })
          }
        }
        const canAcceptResult = await this.connectorClient.incomingRequests.canAccept(request.id, { items: items })
        if (canAcceptResult.isError) {
          console.log(canAcceptResult.error)
          return
        }
        const acceptResult = await this.connectorClient.incomingRequests.accept(request.id, { items: items })
        if (acceptResult.isError) {
          console.log(acceptResult.error)
          return
        }
      }
    }
  }
}
