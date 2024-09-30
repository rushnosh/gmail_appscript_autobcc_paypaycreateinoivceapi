
let CLIENT_ID = getPayPalClientId();
let CLIENT_SECRET = getPayPalClientSecret();
let AUTH_TOKEN_ENDPOINT = getPayPalAuthEndpoint();
let INVOICE_ENDPOINT = getPayPalInvoiceEndpoint();

// Great information in how to code the Auth and send invoice request to paypal
// From : https://github.com/hamzaowais/api/blob/master/sendInvoice.gs#L15

/**
 * Area which the Card UI interacts
 */
function payPalInvoiceCreateButAction(event){
  let res = event['formInput'];
  //First check the propertie values - if not same update them first in global scope
  if(getPayPalAuthEndpoint() !== res['AUTH_TOKEN_ENDPOINT']){
      PropertiesService.getUserProperties().setProperty('AUTH_TOKEN_ENDPOINT', res['AUTH_TOKEN_ENDPOINT']);
      AUTH_TOKEN_ENDPOINT = res['AUTH_TOKEN_ENDPOINT'];
  }
  if(getPayPalInvoiceEndpoint() !== res['INVOICE_ENDPOINT']){
      PropertiesService.getUserProperties().setProperty('INVOICE_ENDPOINT', res['INVOICE_ENDPOINT']);
      INVOICE_ENDPOINT = res['INVOICE_ENDPOINT'];
  }
  if(getPayPalClientId() !== res['CLIENT_ID']){
      PropertiesService.getUserProperties().setProperty('CLIENT_ID', res['CLIENT_ID']);
      CLIENT_ID = res['CLIENT_ID'];
  }
  if(getPayPalClientSecret() !== res['CLIENT_SECRET']){
      PropertiesService.getUserProperties().setProperty('CLIENT_SECRET', res['CLIENT_SECRET']);
      CLIENT_SECRET = res['CLIENT_SECRET'];
  }

  //let message = getCurrentMessage(event);
  try{
    sendPaypalApiRequestToCreateInvoiceDraft(event);
        //Returns and "ExpenseCard widget" which will show a result to the UI if the script was a success
    return createGhostlyUICard(null, 'Success: Invoice created succesfully!').build();

  } catch (error){
    return createGhostlyUICard(null, 'Paypal invoice Error: ' + error).build();
  }
}

function payPalInvoiceCreateButActionTest(event){
  Logger.log("This is the form input " + event['formInput']['dateOfMinumumDepositDueDateToString']);
  let invoiceData = createInvoiceData(event);
  Logger.log("This is the invoice Data Event " + invoiceData.invoicer.business_name);  
}

/**
 * This is the main PayPal Api control area - here was gain the Auth keys, the invoice data and the process to create the invoice draft within the Paypal system
 */

function sendPaypalApiRequestToCreateInvoiceDraft(event){

  try{
    let authorizationToken;
    let authorizationObj = getAuthorizationToken(CLIENT_ID,CLIENT_SECRET,AUTH_TOKEN_ENDPOINT);
    if(authorizationObj.error==true){
      errorMessage=authorizationObj.message;
      throw(new Error(errorMessage));
    }
    authorizationToken = authorizationObj.access_token;
    let invoiceData = createInvoiceData(event);
    let res = createInvoiceDraft(invoiceData,authorizationToken);
    //Throw if there was an error responce
    if (res.error == true) throw (new Error(JSON.stringify(res)));   

  } catch(error){
    throw error
  }

}


/**
 * Once we have the authorisation token from Paypal, we can then send a "create Draft" api
 * call into our system - with my business, all I require is the process to perform a Create Draft as I wish to examime the invoice first before submitting it to the client.
 */

function createInvoiceDraft(invoiceData, authorizationToken){
  head = {
    'Authorization':"Bearer "+ authorizationToken,
    'Content-Type': 'application/json'
  }
  params = {
    headers:  head,
    method : "post",
    muteHttpExceptions: true,
    payload:JSON.stringify(invoiceData)    
  }
  let tokenEndpoint=INVOICE_ENDPOINT;
  let request = UrlFetchApp.getRequest(tokenEndpoint, params); 
  let response = UrlFetchApp.fetch(tokenEndpoint, params); 
  
  let responseCode = response.getResponseCode();
  let responseBody = response.getContentText();

  let invoiceResponse={};
  if (responseCode === 201) {
    let responseJson = JSON.parse(responseBody);
    invoiceResponse.error=false;
    invoiceResponse.id=responseJson.id;
    } else {
      invoiceResponse.error=true;
      invoiceResponse.message=Utilities.formatString("Request failed. Expected 200, got %d: %s", responseCode, responseBody);
    }
  
  return invoiceResponse;
}

/**
 * Gain the Authorisation Key from PayPal - this will provide us with Authorisation
 * to create invoices for our business account
 */
function getAuthorizationToken(client_id,secret_id,tokenEndpoint){
    let head = {
      'Authorization':"Basic "+ Utilities.base64Encode(client_id+':'+secret_id),
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    let postPayload = {
        "grant_type" : "client_credentials"
    }
    let params = {
        headers:  head,
        contentType: 'application/x-www-form-urlencoded',
        method : "post",
        muteHttpExceptions: true,
        payload : postPayload      
    }
    //let request = UrlFetchApp.getRequest(tokenEndpoint, params); 
    let response = UrlFetchApp.fetch(tokenEndpoint, params); 
    let responseCode = response.getResponseCode()
    let responseBody = response.getContentText()

    if (responseCode === 200) {
      let tokenResponse={};
      let responseJson = JSON.parse(responseBody);
      if(responseJson&&responseJson.error){
        tokenResponse.error=true;
        tokenResponse.message=responseJson.error;
        return tokenResponse;
      }
      if(responseJson.access_token){
        tokenResponse.error=false;
        tokenResponse.access_token=responseJson.access_token;
        return tokenResponse;
      }
     tokenResponse.error=true;
     tokenResponse.message='Access Token not found';
     return tokenResponse;
    } else {
        let tokenResponse={};
        tokenResponse.error=true;
        tokenResponse.message=Utilities.formatString("Request failed. Expected 200, got %d: %s", responseCode, responseBody);
        return tokenResponse;
      }
}