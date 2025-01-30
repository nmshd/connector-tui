import { ConnectorTUIBase } from "../ConnectorTUIBase.js"
import {
  AddAcceptPendingRelationships,
  AddAcceptPendingRequests,
  AddConnectorInfo,
  AddCreateAndShowTemplate,
  AddDecomposeRelationship,
  AddExit,
  AddGetAttributesOfRelationship,
  AddIdentityDeletionProcess,
  AddSendMail,
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
          AddCreateAndShowTemplate(
            AddAcceptPendingRelationships(
              AddAcceptPendingRequests(
                AddGetAttributesOfRelationship(
                  AddSendMail(
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
  ) {}
