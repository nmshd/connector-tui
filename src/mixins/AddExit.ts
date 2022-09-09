import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase"

export function AddExit<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class Sync extends Base {
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
