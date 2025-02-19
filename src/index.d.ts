// custom type definitions because `tsc` does not support private and protected members for anonymous classes
export declare class ConnectorTUI {
  static create(baseUrl: string, apiKey: string): Promise<ConnectorTUI>
  run(): Promise<void>
}
