import { ConnectorTUIBaseConstructor } from "../ConnectorTUIBase"

export function AddExit<TBase extends ConnectorTUIBaseConstructor>(Base: TBase) {
  return class Sync extends Base {
    constructor(...args: any[]) {
      super(...args)
      this.choices.push({ title: "Exit", value: this.exit })
    }

    protected async exit() {
      process.exit(0)
    }
  }
}
