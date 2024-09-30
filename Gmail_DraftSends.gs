/**
   *  Creates a draft email
   *  as a reply to an existing message.
   *  @param {Object} e An event object passed by the action.
   *  @return {ComposeActionResponse}
   */
  function generateMessageWithAutoBCC(e) {
    let res = e['formInput'];
    
    if(getAutoBccEmailAddress() !== res['autoBccEmailInput']){
      PropertiesService.getUserProperties().setProperty('AUTOBCC_EMAILADDRESS', res['autoBccEmailInput']);
    }
    // Activate temporary Gmail scopes, in this case to allow
    // a reply to be drafted.
    let accessToken = e.gmail.accessToken;
    GmailApp.setCurrentMessageAccessToken(accessToken);

    
    // Creates a draft reply.
    let messageId = e.gmail.messageId;
    let message = GmailApp.getMessageById(messageId);
    Logger.log("This is the before send to function for message.getReplyTo() --- " + message.getReplyTo());
    let draft = returnReplyOrNewThread(message, res['emailSubjectLine']);

    // Return a built draft response. This causes Gmail to present a
    // compose window to the user, pre-filled with the content specified
    // above.
    return CardService.newComposeActionResponseBuilder()
        .setGmailDraft(draft).build();
  }


  function returnReplyOrNewThread(message, subject){
    if (subject == undefined){
        return message.createDraftReply('',
          {
              to: message.getReplyTo(),
              bcc: getAutoBccEmailAddress(),
          }
      );
    } else {
      let signature = Gmail.Users.Settings.SendAs.list("me").sendAs.find(account => account.isDefault).signature;

      return GmailApp.createDraft(message.getReplyTo(),subject, '',
          {
              bcc: getAutoBccEmailAddress(),
              htmlBody: signature +"<br /> <hr /><br /><br /> " + message.getBody()
          }
      );
    }

  }

