import { ConnectorClient as BaseConnectorClient, ConnectorClientConfig } from "@nmshd/connector-sdk"
import { IdentityDeletionProcessEndpoint } from "./IdentityDeletionProcessEndpoint.js"

export class ConnectorClient extends BaseConnectorClient {
  public readonly identityDeletionProcess: IdentityDeletionProcessEndpoint

  public constructor(config: ConnectorClientConfig) {
    super(config)
    this.identityDeletionProcess = new IdentityDeletionProcessEndpoint(this.axiosInstance)
  }
}
