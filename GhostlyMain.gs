//colours
let colourRed = 'FF0000';
let colourGreen = '228B22';
let colourPurple = '7732a8';

let FIELDNAMES = ['Date', 'Name', 'Email Address', 'Spreadsheet URL'];

/**
 * Property of Ghostly Games Entertainment
 * This set of Auto scripts have set goals in mind.
 * 
 * Place a "Draft Reply" which has the email info@ghostlygames.com.au within the BCC section
 * Automate Email Address Captures - first through GSpreadsheet
 * Automate invoice generations through to paypal - BOOKLY wordpress booking parsing
 * 
 * Author: Mike Mikic
 * Date: 19/02/2024
 */

/**
 * Returns the contextual add-on data that should be rendered for
 * the current e-mail thread. This function satisfies the requirements of
 * an 'onTriggerFunction' and is specified in the add-on's manifest.
 *
 * @param {Object} event Event containing the message ID and other context.
 * @returns {Card[]}
 */
function getContextualAddOnMain(event) {
  //Create a Gmail App object with the "current" gamil message selected
  let message = getCurrentMessage(event);

  let card;
  //check if we need to gather the email data from email message
  if (validateEmailPendingOrEnquiry(message)){
    //Populate the prefills to show the end user what has been "parsed" by the email message
    //Logical part of the code - uses the "Helpers.gs" functions
    let prefills;
    let invoiceCreateCheck = false;
    let invoiceData = {};
    let emailToCheck = getEmailAddressOfSender(message);
    //Check if its an enquiry
    if (isEnquiryEmail(message)){
      prefills = [getReceivedDate(message),
                      getNameOfSender(message, true),
                      getEmailAddressOfSender(message, true),
                      getSheetUrl()];
    } else {
      //This is a Pending booking email
      prefills = [getReceivedDate(message),
                      getNameOfSender(message),
                      getEmailAddressOfSender(message),
                      getSheetUrl()];
    }
    if (validateEmailPendingBooking(message)){
      invoiceCreateCheck = true;
      invoiceData = parseEmailForData(message);
    }
    
    //Check if the email already is added to the spreadsheet
    if (doesEmailAddressExsist(emailToCheck)) {
      //Email was already added to the spreadsheet - no need to have resend
      card = createGhostlyUICard(false, "Already Added: " + emailToCheck,invoiceCreateCheck, invoiceData);
    } else {
      //Create the "Returned card"
      card = createGhostlyUICard(prefills,null,invoiceCreateCheck,invoiceData);
    }
  } else {
    //Create the "Returned card"
    card = createGhostlyUICard();

  }

  //Return Card back to Gmail to review on UI
  return [card.build()];
}


