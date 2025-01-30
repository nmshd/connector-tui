import { ConnectorHttpResponse } from "@nmshd/connector-sdk"
import { Endpoint } from "@nmshd/connector-sdk/dist/endpoints/Endpoint"

export enum IdentityDeletionProcessStatus {
  WaitingForApproval = "WaitingForApproval",
  Rejected = "Rejected",
  Approved = "Approved",
  Cancelled = "Cancelled",
}
export interface IdentityDeletionProcess {
  id: string
  status: IdentityDeletionProcessStatus
  createdAt?: string
  createdByDevice?: string
  approvalPeriodEndsAt?: string
  rejectedAt?: string
  rejectedByDevice?: string
  approvedAt?: string
  approvedByDevice?: string
  gracePeriodEndsAt?: string
  cancelledAt?: string
  cancelledByDevice?: string
}

export class IdentityDeletionProcessEndpoint extends Endpoint {
  public async initiateIdentityDeletionProcess(lengthOfGracePeriodInDays?: number): Promise<ConnectorHttpResponse<IdentityDeletionProcess>> {
    return await this.post("/api/v2/IdentityDeletionProcess", undefined, 200, { lengthOfGracePeriodInDays })
  }

  public async getActiveIdentityDeletionProcess(): Promise<ConnectorHttpResponse<IdentityDeletionProcess>> {
    return await this.get("/api/v2/IdentityDeletionProcess")
  }

  public async cancelIdentityDeletionProcess(): Promise<ConnectorHttpResponse<IdentityDeletionProcess>> {
    return await this.delete("/api/v2/IdentityDeletionProcess", undefined, 200)
  }
}
