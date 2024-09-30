/**
 * Creates the main card users see with form inputs to Email Address store.
 * Form can be prefilled with values.
 *
 * @param {String[]} opt_prefills Default values for each input field.
 * @param {String} opt_status Optional status displayed at top of card.
 * @returns {Card}
 */
function createGhostlyUICard(opt_prefills, opt_status, createInvoice = false, invoiceData = null) {
  let card = CardService.newCardBuilder();
  card.setHeader(CardService.newCardHeader().setTitle('Ghostly Scripts').setImageUrl('https://www.ghostlygames.com.au/wp-content/themes/GhostlyGamesTheme/img/ghostlyFavicon.png'));
  //Work out if we need to display a status
  if (opt_status) {
    if (opt_status.indexOf('Error: ') == 0) {
      opt_status = '<font color=\'#'+ colourRed +'\'>' + opt_status + '</font>';
      card.addSection(updateStatusSection(opt_status));
    }
    if (opt_status.indexOf('Success: ') == 0) {
      opt_status = '<font color=\'#'+ colourGreen +'\'>' + opt_status + '</font>';
      card.addSection(updateStatusSection(opt_status));
    }
    if (opt_status.indexOf('Already Added: ') == 0) {
      opt_status = '<font color=\'#'+ colourPurple +'\'>' + opt_status + '</font>';
      card.addSection(updateStatusSection(opt_status));
    }
  }

  //Create BCC Input box
  formBccInputSection = createAutoBCCReplySection(CardService.newCardSection());
  card.addSection(formBccInputSection);

  if (opt_prefills){
    //Create Auto Email grab service
    formEmailGrabSection = createEmailGrabSection(CardService.newCardSection(), opt_prefills);
    card.addSection(formEmailGrabSection);
  }

  if (createInvoice) {
    //Prepopulate the prefills with the data required
    //Then send the data into the input fields

    //Create a create invoice button
    createInvoiceSection = createInvoiceSection(CardService.newCardSection(), invoiceData);
    card.addSection(createInvoiceSection);
  }

  return card;

  function updateStatusSection(opt_status){
    let statusSection = CardService.newCardSection();
    return statusSection.addWidget(CardService.newTextParagraph()
      .setText('<b>' + opt_status + '</b>'));
  }
}

/**
 * Creating the the new Reply form button and add this button and action to the returned card
 * 
 * @return - ButtonSet - CardService.newButtonSet()
 */

function createAutoBCCReplySection(section){
      var textParagraph = CardService.newTextParagraph()
    .setText("<b>Auto BCC Section</b>");
  section.addWidget(textParagraph);

  //Set up an input box for the BCC email address
  let bccInputWidgetBox = CardService.newTextInput()
      .setFieldName('autoBccEmailInput')
      .setTitle('Auto Bcc Email Address')
  if (getAutoBccEmailAddress()) {
    bccInputWidgetBox.setValue(getAutoBccEmailAddress());
  }
  section.addWidget(bccInputWidgetBox)

  //Set up an input box for the Edit Subject line
  let emailSubjectLine = CardService.newTextInput()
      .setFieldName('emailSubjectLine')
      .setTitle('Custom Subject Line')
  section.addWidget(emailSubjectLine)
  

  //Create an action to perform the execution of a function. The function will receive the "EVENT Obj from card input" as a "parameter" when called
  let actionReplyBcc = CardService.newAction().setFunctionName('generateMessageWithAutoBCC');
  //Create a text button to output onto the UI and bind with to the action card service created above
  let replyMessageBccBtn = CardService.newTextButton()
            .setText('Reply Message with BCC')
            .setComposeAction(actionReplyBcc,
          CardService.ComposedEmailType.REPLY_AS_DRAFT);

  //Now create a "BUTTON SET" that we use to add the newly created button, and then place it within a "Widget class"
  let buttonSet = CardService.newButtonSet().addButton(replyMessageBccBtn);
  section.addWidget(buttonSet)

  return section;
}

/**
 * Creating the Auto Email Grab Section which will contain, Name, Email and Spreadsheet to upload data to
 * 
 * @return - ButtonSet - CardService.newButtonSet()
 */
function createEmailGrabSection(section, opt_prefills){
    var textParagraph = CardService.newTextParagraph()
    .setText("<b>Email Capture</b>");
  section.addWidget(textParagraph);
  section = createEmailGrabFormSection(section, FIELDNAMES, opt_prefills);

  //Create an action to perform the execution of a function. The function will receive the "EVENT Obj from card input" as a "parameter" when called
  let sendEmailGrab = CardService.newAction().setFunctionName('sendEmailGrabToSpreadsheet');
  //Create a text button to output onto the UI and bind with to the action card service created above
  let clearFromActiontextButton = CardService.newTextButton()
        .setText('Capture Email')
        .setOnClickAction(sendEmailGrab);

  //Now create a "BUTTON SET" that we use to add the newly created button, and then place it within a "Widget class"
  let buttonSet = CardService.newButtonSet().addButton(clearFromActiontextButton);
  section.addWidget(buttonSet)

  return section;
}
/**
 * Creating the "Create new invoice button"
 * 
 * @return - ButtonSet - CardService.newButtonSet()
 */
function createInvoiceSection(section, invoiceData){

  var textParagraph = CardService.newTextParagraph()
    .setText("<b>Paypal Invoice Generator</b>");
  section.addWidget(textParagraph);
  //Create an action to perform the execution of a function. The function will receive the "EVENT Obj from card input" as a "parameter" when called
  let createNewInvoice = CardService.newAction().setFunctionName('payPalInvoiceCreateButAction');
  //Create a text button to output onto the UI and bind with to the action card service created above
  let createInvoiceActiontextButton = CardService.newTextButton()
        .setText('Invoice Generator - Paypal')
        .setOnClickAction(createNewInvoice);

  //Now create a "BUTTON SET" that we use to add the newly created button, and then place it within a "Widget class"
  let buttonSet = CardService.newButtonSet().addButton(createInvoiceActiontextButton);
  section.addWidget(buttonSet)

  section = createInvoiceDataForm(section, invoiceData);

  let cardSection1Divider1 = CardService.newDivider();
  section.addWidget(cardSection1Divider1);
  var textParagraph2 = CardService.newTextParagraph()
    .setText("<b>Paypal Configuration</b>");
  section.addWidget(textParagraph2);
  section = createSavePaypalConfigForm(section);

  return section;
}

/**
 * Creates form section to be displayed on card.
 *
 * @param {CardSection} section The card section to which form items are added.
 * @param {String[]} inputNames Names of titles for each input field.
 * @returns {CardSection}
 */
function createEmailGrabFormSection(section, inputNames,opt_prefills) {
  for (let i = 0; i < inputNames.length; i++) {
    let widget = CardService.newTextInput()
      .setFieldName(inputNames[i])
      .setTitle(inputNames[i]);
    if (opt_prefills && opt_prefills[i]) {
      widget.setValue(opt_prefills[i]);
    }
    section.addWidget(widget);
  }
  return section;
}
/**
 * Creates form section to be displayed on card.
 *
 * @param {CardSection} section The card section to which form items are added.
 * @param {String[]} inputNames Names of titles for each input field.
 * @returns {CardSection}
 */
function createInvoiceDataForm(section, invoiceData) {

for (const [key, value] of Object.entries(invoiceData)) {
      let widget = CardService.newTextInput()
      .setFieldName(key)
      .setTitle(key);
      widget.setValue(value);
      section.addWidget(widget);
}
 
  return section;
}

/**
 * Creates form section to be displayed on card.
 *
 * @param {CardSection} section The card section to which form items are added.
 * @param {String[]} inputNames Names of titles for each input field.
 * @returns {CardSection}
 */
function createSavePaypalConfigForm(section) {
try{
  let auth_end_point = getPayPalAuthEndpoint() !== null ? getPayPalAuthEndpoint() : "Please enter in value";
  let paypal_invoice_endpoint = getPayPalInvoiceEndpoint() !== null ? getPayPalInvoiceEndpoint() : "Please enter in value";
  let paypal_client_id =  getPayPalClientId() !== null ? getPayPalClientId() : "Please enter in value";
  let paypal_secret = getPayPalClientSecret() !== null ? getPayPalClientSecret() : "Please enter in value";
  //Auth end point
    let widget = CardService.newTextInput()
    .setFieldName('AUTH_TOKEN_ENDPOINT')
    .setTitle('Authentication EndPoint');
    widget.setValue(auth_end_point);
    section.addWidget(widget);
  //Paypal invoice end point
    let widget1 = CardService.newTextInput()
    .setFieldName('INVOICE_ENDPOINT')
    .setTitle('Paypal Invoice EndPoint');
    widget1.setValue(paypal_invoice_endpoint);
    section.addWidget(widget1);
  //Paypal Client ID
    let widget2 = CardService.newTextInput()
    .setFieldName('CLIENT_ID')
    .setTitle('Paypal Client ID');
    widget2.setValue(paypal_client_id);
    section.addWidget(widget2);
  //Paypal Client ID
    let widget3 = CardService.newTextInput()
    .setFieldName('CLIENT_SECRET')
    .setTitle('Paypal Client Secret');
    widget3.setValue(paypal_secret);
    section.addWidget(widget3);

} catch (error) {
  Logger.log("Error from createSavePaypalConfig Card Method - " + error);
}

 
  return section;
}

/**
 * Recreates the main card without prefilled data.
 *
 * @param {Event} e An event object containing form inputs and parameters.
 * @returns {Card}
 */
function clearForm(e) {
    let prefills = ["",
                  "",
                  "",
                  getSheetUrl()];
  return createGhostlyUICard(prefills, 'Cleared Form' ).build();
}
