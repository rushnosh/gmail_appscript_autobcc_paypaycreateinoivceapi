/**
 * Purpose of this function
 *   * Step one - parse the information from the booking (Bookly) email
 *   * Step two - saved the parsed data into separate variables
 *   * Step three - used the saved variables and use the returned JSON template to send the invoice data to paypal
 * @parms - Gmail.message
 * @return - invoice JSON data
 */

function createInvoiceData(event) {
  let res = event['formInput'];


  return {
    "detail": 
    {
       "currency_code": "AUD",
        "note": "Thank you so much for your Business. Please direct debit including invoice number to Ghostly Games Entertainment BSB: 064 203 ACC: 10670262",
         "term": "To view our Terms and Conditions, please visit our web site on https://www.ghostlygames.com.au/about-us/terms-and-conditions/.If you wish to review our Refund/Cancellation Policies please visit site https://www.ghostlygames.com.au/about-us/terms-and-conditions/deposit-and-cancellation-policy/.",
        "payment_term": { "term_type": "DUE_ON_DATE_SPECIFIED", "due_date": res["dateOfMinumumDepositDueDateToString"] }
     },
    "invoicer": 
      { "business_name": "Ghostly Games Entertainment",
        "name": { "given_name": "Mark", "surname": "Habib" },
        "email_address": "info@ghostlygames.com.au",
         "phones": [ { "country_code": "61", "national_number": "423099381", "phone_type": "MOBILE" } ],
          "website": "www.ghostlygames.com.au",
           "tax_id": "58153611655",
            "logo_url": "https://www.ghostlygames.com.au/wp-content/uploads/2024/02/GhostlyGhostLogoimgcircle_shine.png"
      },
     
      "primary_recipients": [ { "billing_info": 
      { "name": { "given_name": res["clientFirstName"], "surname": res["clientSurname"] },
        "email_address": res["clientEmailAddress"],
          "phones": [ { "country_code": "61",
          "national_number": res["clientPhoneNumber"],
            "phone_type": "MOBILE" 
            } ],
          "additional_info_value": "" },

          } ],
      
       "items": 
        [ { 
          "name": res["serviceName"],
           "description": res["itemsDescription"],
            "quantity": "1",
             "unit_amount": { "currency_code": "AUD", "value": res["itemExGSTPrice"] },
              "tax": { "name": "GST", "percent": "10" }, 
              }
           ],
       
        "configuration": 
        { 
          "partial_payment": { 
            "allow_partial_payment": true,
             "minimum_amount_due": { "currency_code": "AUD", "value": res["itemDepositPrice"]} 
          },
          "tax_calculated_after_discount": true,
           "tax_inclusive": false
        } 
  }
}

/**
 * Here we parse the emails into their respected data objects. This returns an array of data that is required for invoice creations.
 * @param - Gmail Message Object
 * @return - Array of Data
 */
function parseEmailForData(message){
  //first we parse the email into an array for looping
  let dataArray = message.getBody().split(/\r?\n/);

  //Only gather the data needed
  let dataFilterArray = filterRequiredData(dataArray);

  //Strip the unnessesary <br > and </p> tags
  let justStripAarry = justStripTheEndBrAndP(dataFilterArray);

  //Here we remove the Descriptions
  let strippedDescriptionsArray = stripOutDesc(dataFilterArray);

  //Service name splitted into an array
  let booklyServiceName = strippedDescriptionsArray[0].split(',');

//************ Item details required */
  //Descriptive Service name
  let serviceName = createServiceName(strippedDescriptionsArray[0]);

  //Create the items description
  let itemsDescription = createItemDescription(serviceName, justStripAarry);

  //Item price
  let itemPrice = booklyServiceName[2].trim();
  //Item price
  let itemDepositPrice = parseInt(itemPrice) / 2;
  //Ex GST Item price
  let itemExGSTPrice = booklyServiceName[booklyServiceName.length - 1].trim().replace(" ex gst", "");

  let dueDate = new Date(strippedDescriptionsArray[1]); 
  //Date of event
  let dateOfEventString = dueDate.toISOString().split('T')[0];

  //Date of due minimum deposit date
  //NOTE: This is not exactly one month prior to the due date - some glitch with the Date object within Google
  //But this will be close enough for our purposes
  let dateOfMinumumDepositDueDate = new Date(new Date().setDate(dueDate.getDate() - 2));
  let dateOfMinumumDepositDueDateToString = dateOfMinumumDepositDueDate.toISOString().split('T')[0];

  let clientFullName = strippedDescriptionsArray[3];
  let cfnArray = clientFullName.split(/\s/);
  //Split into two names

  //Split into two names
  let clientFirstName = "";
  let clientSurname = "";

  if (cfnArray.length > 2){
    clientFirstName = cfnArray.shift();
    cfnArray.forEach((e)=>{clientSurname = clientSurname + " " + e});
    clientSurname.trim();
  } else {
    clientFirstName = cfnArray[0];
    clientSurname = cfnArray[1];
  }

  let clientPhoneNumber = parseClientPhoneNumber(strippedDescriptionsArray[4]);
  let clientEmailAddress = strippedDescriptionsArray[5];


  return {
    clientPhoneNumber: clientPhoneNumber,
    clientFirstName: clientFirstName,
    clientSurname: clientSurname,
    clientEmailAddress: clientEmailAddress,
    serviceName: serviceName,
    itemsDescription: itemsDescription,
    itemPrice: itemPrice,
    itemDepositPrice: itemDepositPrice,
    itemExGSTPrice: itemExGSTPrice,
    dateOfEventString: dateOfEventString,
    dateOfMinumumDepositDueDateToString: dateOfMinumumDepositDueDateToString
  }
}

function parseClientPhoneNumber(phoneNumber){
  if(phoneNumber.includes('+61')){
   return phoneNumber.slice(3);
  } else if (phoneNumber.substring(0,2) == '61'){
    return phoneNumber.slice(2);
  } else if (phoneNumber.substring(0,2) == '04'){
    return phoneNumber.slice(1);
  } else {
    return phoneNumber;
  }
}

function createItemDescription(serviceName, justStripAarry){
  let returnName = "";

  returnName = serviceName;
  justStripAarry.forEach((item) => returnName = returnName + "   " + item);
  return returnName;

}

function createServiceName(serviceName){
  //We need to strip the name 
  //Example: MGT + PG5G, 2 h, 565, S, 513.64 ex gst
  let stripArray = serviceName.split(",");
  return returnTimeForService(stripArray[1].trim()) + " " + returnServiceName(stripArray[0].trim());

}

function returnTimeForService(time){

  switch(time) {
  case '1 h':
    return "1 hour";
  case '2 h':
    return "2 hours";
  case '3 h':
    return "3 hours";
  case '4 h':
    return "4 hours";
  case '5 h':
    return "5 hours";
  case '6 h':
    return "6 hours";
  default:
    return "";
  }
}

function returnServiceName(name){
  switch(name) {
  case "MGT":
    return "Mobile Game Theatre";
  case "MGT + 5G":
    return "Mobile Game Theatre. 5G internet.";
  case "MGT + PG5G":
    return "Mobile Game Theatre Service. Power Generator and 5G internet included.";
  case "MGT + VR + 5G":
    return "Mobile Game Theatre and Virtual Reality. 5G internet included.";
  case "MGT + VR + PG5G":
    return "Mobile Game Theatre and Virtual Reality. Power Generator and 5G internet included.";
  case "MGT + VR":
    return "Mobile Game Theatre and Virtual Reality.";
  case "MGT + VR + LT":
    return "Mobile Game Theatre and Laser Tag with Virtual Reality.";
  case "MGT + VR + LT + 5G":
    return "Mobile Game Theatre and Laser Tag with Virtual Reality. 5G internet included.";
  case "MGT + VR + LT + PG5G":
    return "Mobile Game Theatre and Laser Tag with Virtual Reality. Power Generator and 5G internet included.";
  case "MGTLTSP":
    return "Half Half Deal - Mobile Game Theatre and Laser Tag special.";
  case "MGTLTSP + 5G":
    return "Half Half Deal - Mobile Game Theatre and Laser Tag special. 5G internet included.";
  case "MGTLTSP + PG5G":
    return "Half Half Deal - Mobile Game Theatre and Laser Tag special. Power Generator and 5G internet included.";
  case "VGT":
    return "Van Game Theatre."
  case "VGT + 4G":
    return "Van Game Theatre. 4G internet included."
  case "VGT + LT":
    return "Van Game Theatre and Laser Tag package."
  case "MGT + LT":
    return "Mobile Game Theatre and Laser Tag package."
  case "MGT + LT + 5G":
    return "Mobile Game Theatre and Laser Tag package. 5G internet included."
  case "MGT + LT + PG5G":
    return "Mobile Game Theatre and Laser Tag package. Power Generator and 5G internet included."
  case "LT":
    return "Laser Tag Service."
  default:
    return "";
}

}

function filterRequiredData(arr) {
    return arr.filter((elm) => {
    //Check for service:
    if(elm.includes("Service:")){
      return elm;
    }
    //Check for Date:
    if(elm.includes("Date:")){
      return elm;
    }
    //Check for Time:
    if(elm.includes("Time:")){
      return elm;
    }
    //Check for Client name:
    if(elm.includes("Client name:")){
      return elm;
    }
    //Check for Client Phone:
    if(elm.includes("Client phone:")){
      return elm;
    }
    //Check for Client email:
    if(elm.includes("Client email:")){
      return elm;
    }
    //Check for Client Address:
    if(elm.includes("Client Address:")){
      return elm;
    }
  });
}

function stripOutDesc(dataArrayToStrip){
    return justStripTheEndBrAndP(dataArrayToStrip).map((elm) => {
    //Check for service:
    if(elm.includes("Service:")){
      return elm.substring(9);
    }
    //Check for Date:
    if(elm.includes("Date:")){
      return elm.substring(6);
    }
    //Check for Time:
    if(elm.includes("Time:")){
      return elm.substring(6);
    }
    //Check for Client Name:
    if(elm.includes("Client name:")){
      return elm.substring(13);
    }
    //Check for Client Phone:
    if(elm.includes("Client phone:")){
      return elm.substring(15);
    }
    //Check for Client email:
    if(elm.includes("Client email:")){
      return elm.substring(14);
    }
    //Check for Client Address:
    if(elm.includes("Client Address:")){
      return elm.substring(16);
    }
  })
}

function justStripTheEndBrAndP(dataFilterArray) {
  return dataFilterArray.map((elm) => {
    //Check for service:
    if(elm.includes("Service:")){
      return elm.substring(3,elm.indexOf('<br />'));
    }
    //Check for Date:
    if(elm.includes("Date:")){
      return elm.substring(0,elm.indexOf('<br />'));
    }
    //Check for Time:
    if(elm.includes("Time:")){
      return elm.substring(0,elm.indexOf('<br />'));
    }
    //Check for Client Name:
    if(elm.includes("Client name:")){
      return elm.substring(0,elm.indexOf('<br />'));
    }
    //Check for Client Phone:
    if(elm.includes("Client phone:")){
      return elm.substring(0,elm.indexOf('<br />'));
    }
    //Check for Client email:
    if(elm.includes("Client email:")){
      return elm.substring(0,elm.indexOf('</p>'));
    }
    //Check for Client Address:
    if(elm.includes("Client Address:")){
      return elm.substring(3,elm.indexOf('</p>'));
    }
  });
}

function createInvoiceTEMPLATEData() {
  return {
    "detail": 
    { "invoice_number": "#123",
     "reference": "deal-ref",
      "invoice_date": "2018-11-12",
       "currency_code": "USD",
        "note": "Thank you for your business.",
         "term": "No refunds after 30 days.",
          "memo": "This is a long contract",
           "payment_term": { "term_type": "NET_10", "due_date": "2018-11-22" }
     },
     "invoicer": 
      { "name": { "given_name": "Michael", "surname": "Mikic" },
       "address": { 
        "address_line_1": "68 Bremen Street", "address_line_2": "", "admin_area_2": "Hemmant", "admin_area_1": "QLD", "postal_code": "4174", "country_code": "AU" },
        "email_address": "info@ghostlygames.com.au",
         "phones": [ { "country_code": "61", "national_number": "474772650", "phone_type": "MOBILE" } ],
          "website": "www.ghostlygames.com.au",
           "tax_id": "51378117083",
            "logo_url": "https://www.ghostlygames.com.au/wp-content/themes/GhostlyGamesTheme/img/icons/ghostlyGamesLogoShine.svg"
      },
     
      "primary_recipients": [ { "billing_info": 
      { "name": { "given_name": "Stephanie", "surname": "Meyers" },
       "address": { "address_line_1": "1234 Main Street",
          "admin_area_2": "Anytown",
          "admin_area_1": "CA",
            "postal_code": "98765",
            "country_code": "US" },
        "email_address": "bill-me@example.com",
          "phones": [ { "country_code": "001",
          "national_number": "4884551234",
            "phone_type": "HOME" 
            } ],
          "additional_info_value": "add-info" },

        "shipping_info": { "name": { "given_name": "Stephanie", "surname": "Meyers" },
           "address": { "address_line_1": "1234 Main Street", "admin_area_2": "Anytown", "admin_area_1": "CA", "postal_code": "98765", "country_code": "US" }
            } 
          } ],
      
       "items": 
        [ { 
          "name": "Yoga Mat",
           "description": "Elastic mat to practice yoga.",
            "quantity": "1",
             "unit_amount": { "currency_code": "USD", "value": "50.00" },
              "tax": { "name": "Sales Tax", "percent": "7.25" }, 
              "discount": { "percent": "5" }, "unit_of_measure": "QUANTITY" 
              },
               { 
                "name": "Yoga t-shirt", 
                "quantity": "1", 
                "unit_amount": { "currency_code": "USD", "value": "10.00" },
                 "tax": { "name": "Sales Tax", "percent": "7.25", "tax_note": "Reduced tax rate" },
                  "discount": { "amount": { "currency_code": "USD", "value": "5.00" } },
                   "unit_of_measure": "QUANTITY"
             } ],
       
        "configuration": 
        { 
          "partial_payment": { 
            "allow_partial_payment": true, "minimum_amount_due": { "currency_code": "USD", "value": "20.00" } },
         "allow_tip": true,
          "tax_calculated_after_discount": true,
           "tax_inclusive": false,
            "template_id": "TEMP-19V05281TU309413B" 
        },
        
       "amount": {
         "breakdown": { 
            "custom": { 
                "label": "Packing Charges", "amount": { "currency_code": "USD", "value": "10.00" } 
              },
               "shipping": { "amount": { "currency_code": "USD", "value": "10.00" },
                "tax": { "name": "Sales Tax", "percent": "7.25" } },
                 "discount": { "invoice_discount": { "percent": "5" } } 
          } 
        } 
  }
}
