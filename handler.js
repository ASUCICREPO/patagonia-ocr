/*

https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Textract.html
https://docs.aws.amazon.com/textract/latest/dg/api-async.html
*/
const uniqid = require('uniqid');

const authorize = require('./lib/authorizer');
const upload = require('./lib/uploader');
const callTextract = require('./lib/textractCaller');
// const callTextractSync = require('./lib/textractCallerSync');
const processBill = require('./lib/billProcessor');
const saveResult = require('./lib/resultSaver');
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
    // const ocr = await callTextractSync(bill, requestID);
    console.log(ocr);

    if (!ocr) {
      return respond(502, 'Data extraction cannot be performed');
    }

    // handle extracted data
    const processed = await processBill(ocr);

    if (!processed) {
      return respond(
        500,
        'Extracted data cannot be processed',
      );
    }

    const saved = await saveResult(processed);

    if (!saved) {
      return respond(
        500,
        'Processed data cannot be saved',
      );
    }

    return respond(200, saved.keyValues);
  } catch (e) {
    console.log(e);
    return respond(500, 'Internal Server Error');
  }
};
