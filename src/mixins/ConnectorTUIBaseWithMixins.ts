import { ConnectorTUIBase } from "../ConnectorTUIBase.js"
import {
  AddAcceptPendingRelationships,
  AddAcceptPendingRequests,
  AddConnectorInfo,
  AddDecomposeRelationship,
  AddDeleteAttribute,
  AddExit,
  AddGetAttributesOfRelationship,
  AddIdentityDeletionProcess,
  AddSendMail,
  AddSendPremadeRequestByMessage,
  AddSendRequestByMessage,
  AddShareRequestByTemplate,
  AddSync,
  AddTerminateRelationship,
  AddUploadFile,
} from "./index.js"

export class ConnectorTUIBaseWithMixins
  //
  extends AddExit(
    AddConnectorInfo(
      AddDecomposeRelationship(
        AddTerminateRelationship(
          AddAcceptPendingRelationships(
            AddAcceptPendingRequests(
              AddDeleteAttribute(
                AddGetAttributesOfRelationship(
                  AddSendMail(
                    AddSendPremadeRequestByMessage(
                      AddSendRequestByMessage(
                        AddShareRequestByTemplate(
                          AddSync(
                            AddUploadFile(
                              AddIdentityDeletionProcess(
                                //
                                ConnectorTUIBase
                              )
                            )
                          )
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  ) {}
