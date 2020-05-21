'use strict';
/*

https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Textract.html
https://docs.aws.amazon.com/textract/latest/dg/api-async.html
*/

const authorize = require('./lib/authorizer');
const uploadS3 = require('./lib/s3Uploader');
const callTextract = require('./lib/textractCaller');
const processBill = require('./lib/billProcessor');

module.exports.process = async (event, context) => {

  try {

    const proceed = await authorize(event);

    if(!proceed) {
      return respond(401, 'Unauthorized');
    }

    const bill = await uploadS3(event);

    if(!bill) {
      return respond(502, 'Can\' upload file');
    }

  ///////
  return;
    // TEMP hardcoded object key
    //const bill = 's3://asu-cic-textract-api-dev-bills/tep_mock_bill_with_notations.pdf';


    const ocr = await callTextract(bill);

    if(!ocr) {
      return respond(502, 'Can\' process file');
    }

    return respond(200, ocr);

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

