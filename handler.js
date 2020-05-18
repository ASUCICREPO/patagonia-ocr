'use strict';
/*

https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Textract.html
https://docs.aws.amazon.com/textract/latest/dg/api-async.html


  - validate request token
  - upload POSTed bill to S3
  - call Textract ~ setInterval with exponential backoff ~
  - interpret Textract results
  - detect missing fields
  - fill-in missing fields parsing from FullText
  - respond the request

*/
const validate_request_token = require('./lib/validate_request_token');
const upload_bill_to_s3 = require('./lib/upload_bill_to_s3');
const call_textract = require('./lib/call_textract');
const interpret_ocr = require('./lib/interpret_ocr');
const detect_missing_fields = require('./lib/detect_missing_fields');
const fill_missing_fields = require('./lib/fill_missing_fields');

module.exports.process = async (event, context) => {
  console.log(process.env.BUCKET_FOR_BILLS);
  console.log(event, context);

  try {

    const proceed = await validate_request_token(context);

    if(!proceed) {
      return respond(403, 'Forbidden');
    }

    const { file } = event;

    if(!file) {
      return respond(406, 'Provide a file');
    }

    const bill = await upload_bill_to_s3(file);

    if(!bill) {
      return respond(502, 'Can\' upload file');
    }

    const ocr = await call_textract(bill);

    if(!ocr) {
      return respond(502, 'Can\' process file');
    }

    const interpreted = await interpret_ocr(ocr);

    if(!interpreted) {
      return respond(502, 'Can\' satisfy interpreter');
    }

    const missing = await detect_missing_fields(interpreted);

    if(!missing) { // no missing fields
      return respond(200, interpreted);
    }

    const complete = await fill_missing_fields(interpreted, missing);

    if(!complete) {
      return respond(206, interpreted);
    }

    return respond(200, complete);

  } catch (e) {
    console.log(e);
    return respond(500, 'Server Error');
  }

};

const respond = (statusCode, data, headers = {}) => {

  return ({
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(data)
  });

};

