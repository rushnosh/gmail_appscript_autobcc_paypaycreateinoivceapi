/**
 * Retrieves the current message given an action event object.
 * @param {Event} event Action event object
 * @return {Message}
 */
function getCurrentMessage(event) {
  let accessToken = event.messageMetadata.accessToken;
  let messageId = event.messageMetadata.messageId;
  GmailApp.setCurrentMessageAccessToken(accessToken);
  return GmailApp.getMessageById(messageId);
}

/**
 * This function confirms if the email is either an "Enquiry" or a "Pending Booking email"
 * If its one of these items - return "true"
 * 
 * @params - {message object - gmail}
 * @return - boolean - true or false
 */

function validateEmailPendingOrEnquiry(message) {
  let subjectChck = message.getSubject();
  if (subjectChck.includes("New booking PENDING STATUS")){
    return true;
  }
  if (subjectChck.includes("Ghostly Games") && subjectChck.includes("Enquiry")){
    return true;
  }
  return false;
}
/**
 * This function confirms if the email is just "Pending Booking email"
 * If its one of these items - return "true"
 * 
 * @params - {message object - gmail}
 * @return - boolean - true or false
 */

function validateEmailPendingBooking(message) {
  let subjectChck = message.getSubject();
  if (subjectChck.includes("New booking PENDING STATUS")){
    return true;
  }
  return false;
}

/**
 * Determines most recent spreadsheet URL.
 * Returns null if no URL was previously submitted.
 *
 * @returns {String}
 */
function getSheetUrl() {
  return PropertiesService.getUserProperties().getProperty('SPREADSHEET_URL');
}
/**
 * Determines the Paypal Auth Endpoint config
 * Returns null if no URL was previously submitted.
 *
 * @returns {String}
 */
function getPayPalAuthEndpoint() {
  return PropertiesService.getUserProperties().getProperty('AUTH_TOKEN_ENDPOINT');
}
/**
 * Determines the Paypal Invoice Endpoint config
 * Returns null if no URL was previously submitted.
 *
 * @returns {String}
 */
function getPayPalInvoiceEndpoint() {
  return PropertiesService.getUserProperties().getProperty('INVOICE_ENDPOINT');
}
/**
 * Determines the Paypal Client ID config
 * Returns null if no URL was previously submitted.
 *
 * @returns {String}
 */
function getPayPalClientId() {
  return PropertiesService.getUserProperties().getProperty('CLIENT_ID');
}
/**
 * Determines the Paypal Client ID config
 * Returns null if no URL was previously submitted.
 *
 * @returns {String}
 */
function getPayPalClientSecret() {
  return PropertiesService.getUserProperties().getProperty('CLIENT_SECRET');
}

/**
 * Determines most recent BCC Auto email entry.
 * Returns null if no email was previously submitted.
 *
 * @returns {String}
 */
function getAutoBccEmailAddress() {
  return PropertiesService.getUserProperties().getProperty('AUTOBCC_EMAILADDRESS');
}

/**
 * Gets the current messages subject line.
 *
 * @returns {String}
 */
function getSubjectLineForCurrentMessage(message) {
  return message.getSubject();
}

/**
 * Checks to see if this is an enquiry email and returns true or false
 * 
 * @param - {Message object - gmail}
 * @returns - boolean
 */
function isEnquiryEmail(message){
  let subjectChck = message.getSubject();
  if (subjectChck.includes("Ghostly Games") && subjectChck.includes("Enquiry")){
    return true;
  } else {
    return false;
  }
}

/**
 * Returns the date from the message param
 * 
 * @param {message object - gmail}
 * @return String (the date)
 */
function getReceivedDate(message){
  return new Date(message.getDate()).toString().substring(0,15);
}

/**
 * Returns the Senders name from the gmail message
 * 
 * @param {message object - gmail}, optional boolean value
 * @return String (The name)
 */
function getNameOfSender(message, isEnquiryEmail = false){
  if (isEnquiryEmail){
    return message.getFrom().replace(/<\w.*/, "");
  } else {
    //This is the pending email check
    let strArry = message.getReplyTo().split(" ");
    if (strArry.length > 2){
      return strArry[0] + " " + strArry[1];
    } else {
      return strArry[0];
    }
  }
}

/**
 * Returns the email address fromt eh "ReplyTo" message method
 * @param {message object - gmail}, optional boolean value
 * @return String (The email) 
 */
function getEmailAddressOfSender(message, isEnquiryEmail = false){
  if (isEnquiryEmail){
    return message.getReplyTo();
  } else {
    //This is the pending email check
    let strArry = message.getReplyTo().split(" ");
    let returnEmail = strArry[strArry.length - 1].replace(/^<+/, '').replace(/>+$/, '');
    return returnEmail;
  }
}

