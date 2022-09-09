import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase"

export function AddSync<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class Sync extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Sync", value: this.sync })
    }

    protected async sync() {
      const syncRequest = await this.connectorClient.account.sync()
      if (syncRequest.isError) {
        console.error(syncRequest.error)
        return
      }
      console.log(syncRequest.result)
    }
  }
}
