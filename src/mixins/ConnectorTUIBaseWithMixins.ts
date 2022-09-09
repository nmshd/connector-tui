import { ConnectorTUIBase } from "../ConnectorTUIBase"
import { AddAcceptPendingRelationships } from "./AddAcceptPendingRelationships"
import { AddGetAttributesOfContact } from "./AddGetAttributesOfContact"
import { AddSendMail } from "./AddSendMail"
import { AddSendRequestByMessage } from "./AddSendRequestByMessage"
import { AddShareRequestByTemplate } from "./AddShareRequestByTemplate"
import { AddSync } from "./AddSync"
import { AddUploadFile } from "./AddUploadFile"

export class ConnectorTUIBaseWithMixins
  //
  extends AddAcceptPendingRelationships(
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
  ) {}
