
/**
 * Check if the email address does not exsist from within the attached spreadsheet
 * @param - string - email address
 * @return - boolean - true or false
 */
function doesEmailAddressExsist(emailAddr){
  
  try{
    let sheet = SpreadsheetApp
      .openByUrl(getSheetUrl())
      .getActiveSheet();
    //Need to check the spreadsheet to confirm if the email address does not already exsist
    let lastRow = sheet.getLastRow()
    let range = sheet.getRange(1, 3, lastRow);
    let values = range.getValues();
    //var range = sheet.getRange("C:C");
    //var values = range.getValues();
    for(var i in values){
      if(values[i][0].match(emailAddr)!=null){
        return true; 
      } 
    }
  }
  catch(err){
    return false;
  }
  return false;
}

/**
 * Logs form inputs into a spreadsheet given by URL from form.
 * Then displays edit card.
 *
 * @param {Event} e An event object containing form inputs and parameters.
 * @returns {Card}
 */
function sendEmailGrabToSpreadsheet(e) {
  let message = getCurrentMessage(e);
  let res = e['formInput'];
  try {
    FIELDNAMES.forEach(function(fieldName) {
      if (! res[fieldName]) {
        throw 'incomplete form';
      }
    });
    //Store the Spreadsheet URL within the User's own property store location - that way we don't have to ask the user for this spreadsheet URL location again
    if(getSheetUrl() !== res['Spreadsheet URL']){
      PropertiesService.getUserProperties().setProperty('SPREADSHEET_URL', res['Spreadsheet URL']);
    }

    let sheet = SpreadsheetApp
      .openByUrl((res['Spreadsheet URL']))
      .getActiveSheet();

    //Debugging
    /*Logger.log('This is FieldNames length : ' + FIELDNAMES.length)
    Logger.log('This is slice of the FIELDNAMES: ' + FIELDNAMES.slice(0, FIELDNAMES.length - 1));
    Logger.log('This is the objToArray return ' + objToArray(res, FIELDNAMES.slice(0, FIELDNAMES.length - 1)));
    */
    //The sheet.appendRow requires an array of data to append the LAST row of the given active spreadsheet
    sheet.appendRow(objToArray(res, FIELDNAMES.slice(0, FIELDNAMES.length - 1)));

    //Once the spreadsheet is appended we then add the "Customer Lable" to mark as captured on the message thread
    let message = getCurrentMessage(e);
    // Add label Customer to the message thread in the inbox
    let label = GmailApp.getUserLabelByName("GhostlyGamesBusiness/Customers");

    //Add lable to the thread object
    message.getThread().addLabel(label)

    //Returns and "ExpenseCard widget" which will show a result to the UI if the script was a success
    return createGhostlyUICard(null, 'Success: Email Captured successfully!', validateEmailPendingBooking(message), validateEmailPendingBooking(message) ? parseEmailForData(message) : null).build();
  }
  catch (err) {
    if (err == 'Exception: Invalid argument: url') {
      err = 'Invalid URL';
      res['Spreadsheet URL'] = null;
    }
    //Returns and "ExpenseCard widget" which will show a result to the UI if the script was a FAIL!
    return createGhostlyUICard(objToArray(res, FIELDNAMES), 'Error: ' + err).build();
  }
}

/**
 * Returns an array corresponding to the given object and desired ordering of keys.
 *
 * @param {Object} obj Object whose values will be returned as an array.
 * @param {String[]} keys An array of key names in the desired order.
 * @returns {Object[]}
 */
function objToArray(obj, keys) {
  return keys.map(function(key) {
    return obj[key];
  });
}

