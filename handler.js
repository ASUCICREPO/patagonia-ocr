const uniqid = require('uniqid');

const authorize = require('./lib/authorizer');
const upload = require('./lib/uploader');
const callTextractAsync = require('./lib/textractCallerAsync');
const callTextractSync = require('./lib/textractCallerSync');
const processDocument = require('./lib/documentProcessor');
const saveResult = require('./lib/resultSaver');
const respond = require('./lib/responder');

module.exports.process = async (event) => {
  const qs = event.queryStringParameters;
  const debug = qs && Object.hasOwnProperty.call(qs, 'debug');

  let object;
  let ocr;
  let processed;

  try {
    authorize(event);

    const requestID = `${new Date().getTime()}_${uniqid()}`;
    console.log('requestID', requestID);
    // console.log('event', event);

    // validate and save the file
    object = await upload(event, requestID);

    // perform OCR on file
    if (object.type === 'application/pdf') {
      ocr = await callTextractAsync(object.key, requestID);
    } else {
      ocr = await callTextractSync(object.key, requestID);
    }
    // console.log('OCR', ocr);

    // handle extracted data
    processed = processDocument(ocr.keyValues, ocr.rawText);

    // save extracted data
    await saveResult(processed, requestID);

    // respond the request
    let output = processed.extracted;
    if (debug) {
      console.log('Debug successful response');
      output = {
        object,
        ocr,
        processed,
      };
    }

    return respond(200, output);
  } catch (e) {
    console.error(e);

    if (debug) {
      console.log('Debug error response');
      return respond(e.statusCode, {
        statusCode: e.statusCode,
        message: e.message,
        debug: {
          object,
          ocr,
          processed,
        },
      });
    }

    switch (e.statusCode) {
      case 400: // Bad Request
      case 401: // Unauthorized
      case 413: // Payload Too Large
      case 415: // Unsupported Media Type
      case 422: // Unprocessable Entity
      case 501: // Not Implemented
      case 504: // Gateway Timeout
        return respond(e.statusCode, e.message);

      default:
        return respond(500, 'Internal Server Error');
    }
  }
};
