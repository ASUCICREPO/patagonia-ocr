const uniqid = require('uniqid');

const authorize = require('./lib/authorizer');
const { upload, uploadExtracted } = require('./lib/uploader');
const callTextractAsync = require('./lib/textractCallerAsync');
const callTextractSync = require('./lib/textractCallerSync');
const mapTextractOutput = require('./lib/textractMapper');
const processDocument = require('./lib/documentProcessor');
const saveResult = require('./lib/resultSaver');
const respond = require('./lib/responder');

module.exports.process = async (event) => {
  const qs = event.queryStringParameters || {};
  const debug = Object.hasOwnProperty.call(qs, 'debug');

  let response = [];

  let object = {};
  let extracted = {};
  let mapped = {};
  let processed = {};

  try {
    authorize(event);

    const requestId = `${new Date().getTime()}_${uniqid()}`;
    console.log('requestId', requestId);
    if (debug) {
      console.log('DEBUG mode');
      console.log('event', event);
    }

    // validate and save the file
    object = await upload(event, requestId);

    // perform OCR on file
    if (object.type === 'application/pdf') {
      extracted = await callTextractAsync(object.key);
    } else {
      extracted = await callTextractSync(object.key);
    }

    if (debug) {
      await uploadExtracted(extracted, requestId);
    }

    // map extracted data
    mapped = mapTextractOutput(extracted);

    // augment and select data for known documentTypes
    processed = processDocument(mapped.keyValues, mapped.rawText);

    // save processed data
    await saveResult(processed, requestId);

    // respond the request with SUCCESS
    let output = processed.extracted;
    if (debug) {
      output = {
        object,
        extracted,
        mapped,
        processed,
      };
    }
    response = [200, output];
    console.log('requestId', requestId, 'SUCCESS');
  } catch (e) {
    console.error(e); // log all catched errors

    // respond the request with a registered ERROR
    switch (e.statusCode) {
      case 400: // Bad Request
      case 401: // Unauthorized
      case 413: // Payload Too Large
      case 415: // Unsupported Media Type
      case 422: // Unprocessable Entity
      case 501: // Not Implemented
      case 504: // Gateway Timeout
        response = [e.statusCode, e.message];
        break;

      default:
        response = [500, 'Internal Server Error'];
    }

    if (debug) {
      response = [e.statusCode, {
        statusCode: e.statusCode,
        message: e.message,
        debug: {
          object,
          extracted,
          mapped,
          processed,
        },
      }];
    }
    console.log('requestId', requestId, 'ERROR');
  }

  return respond(response);
};
