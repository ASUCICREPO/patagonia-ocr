/*

https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Textract.html
https://docs.aws.amazon.com/textract/latest/dg/api-async.html
*/
const uniqid = require('uniqid');

const authorize = require('./lib/authorizer');
const upload = require('./lib/uploader');
const callTextract = require('./lib/textractCaller');
const processBill = require('./lib/billProcessor');
const respond = require('./lib/responder');

module.exports.process = async (event) => {
  try {
    const proceed = authorize(event);

    if (!proceed) {
      return respond(401, 'Unauthorized');
    }

    const requestID = `${new Date().getTime()}_${uniqid()}`;
    console.log('requestID', requestID);

    // validate and save the file
    const bill = await upload(event, requestID);

    if (!bill) {
      return respond(415, 'Unsupported Media Type');
    }

    // perform OCR on file
    const ocr = await callTextract(bill, requestID);
    console.log(ocr);

    if (!ocr) {
      return respond(502, 'Bad Gateway (data extraction cannot be performed)');
    }

    // handle extracted data
    const processed = await processBill(ocr);

    if (!processed) {
      return respond(
        500,
        'Internal Server Error (extracted data cannot be processed)'
      );
    }

    return respond(200, processed);
  } catch (e) {
    console.log(e);
    return respond(500, 'Internal Server Error');
  }
};
