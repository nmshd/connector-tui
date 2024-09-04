import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase.js"

export function AddExit<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class Exit extends Base {
    public constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Exit", value: this.exit })
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    protected async exit() {
      process.exit(0)
    }
  }
}
