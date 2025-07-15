// custom type definitions because `tsc` does not support private and protected members for anonymous classes
export declare class ConnectorTUI {
  public static create(baseUrl: string, apiKey: string): Promise<ConnectorTUI>
  public run(): Promise<void>
}
