import { ConnectorTUIBase } from "../ConnectorTUIBase"
import { AddAcceptPendingRelationships } from "./AddAcceptPendingRelationships"
import { AddAcceptPendingRequests } from "./AddAcceptPendingRequests"
import { AddExit } from "./AddExit"
import { AddGetAttributesOfContact } from "./AddGetAttributesOfContact"
import { AddSendMail } from "./AddSendMail"
import { AddSendRequestByMessage } from "./AddSendRequestByMessage"
import { AddShareRequestByTemplate } from "./AddShareRequestByTemplate"
import { AddSync } from "./AddSync"
import { AddUploadFile } from "./AddUploadFile"

export class ConnectorTUIBaseWithMixins
  //
  extends AddExit(
    //
    AddAcceptPendingRelationships(
      AddAcceptPendingRequests(
        //
        AddGetAttributesOfContact(
          //
          AddSendMail(
            //
            AddSendRequestByMessage(
              //
              AddShareRequestByTemplate(
                //
                AddSync(
                  //
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
  ) {}
