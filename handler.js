const uniqid = require('uniqid');

const authorize = require('./lib/authorizer');
const upload = require('./lib/uploader');
const callTextractAsync = require('./lib/textractCallerAsync');
const callTextractSync = require('./lib/textractCallerSync');
const processDocument = require('./lib/documentProcessor');
const saveResult = require('./lib/resultSaver');
const respond = require('./lib/responder');

module.exports.process = async (event) => {
  try {
    authorize(event);

    const requestID = `${new Date().getTime()}_${uniqid()}`;
    console.log('requestID', requestID, event);

    // validate and save the file
    const object = await upload(event, requestID);

    // perform OCR on file
    let ocr;
    if (object.type === 'application/pdf') {
      ocr = await callTextractAsync(object.key, requestID);
    } else {
      ocr = await callTextractSync(object.key, requestID);
    }
    console.log('OCR', ocr);

    // handle extracted data
    const processed = await processDocument(ocr.keyValues, ocr.rawText);

    // save extracted data
    await saveResult(processed, requestID);

    return respond(200, processed.keyValues);
  } catch (e) {
    console.log('ERROR', e);

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
