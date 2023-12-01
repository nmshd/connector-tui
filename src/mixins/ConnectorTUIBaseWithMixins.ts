import { ConnectorTUIBase } from "../ConnectorTUIBase.js"
import {
  AddAcceptPendingRelationships,
  AddAcceptPendingRequests,
  AddConnectorInfo,
  AddCreateAndShowTemplate,
  AddExit,
  AddGetAttributesOfRelationship,
  AddSendMail,
  AddSendRequestByMessage,
  AddShareRequestByTemplate,
  AddSync,
  AddUploadFile,
} from "./index.js"

export class ConnectorTUIBaseWithMixins
  //
  extends AddExit(
    AddConnectorInfo(
      AddCreateAndShowTemplate(
        AddAcceptPendingRelationships(
          AddAcceptPendingRequests(
            AddGetAttributesOfRelationship(
              AddSendMail(
                AddSendRequestByMessage(
                  AddShareRequestByTemplate(
                    AddSync(
                      AddUploadFile(
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
  ) {}
