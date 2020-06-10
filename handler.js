const uniqid = require('uniqid');

const authorize = require('./lib/authorizer');
const { upload, uploadDebug } = require('./lib/uploader');
const { callTextractAsync, retrieveTextractResults } = require('./lib/textractCallerAsync');
const callTextractSync = require('./lib/textractCallerSync');
const mapTextractOutput = require('./lib/textractMapper');
const processDocument = require('./lib/documentProcessor');
const validateProcessed = require('./lib/processedValidator');
const { saveResult, retrieveResult } = require('./lib/resultHandler');
const respond = require('./lib/responder');

let debug = false;
let response = [];
const metadata = {};
let resumeAsync = false;

let object = {};
let extracted = {};
let mapped = {};
let processed = {};
let validated = {};

const postExtraction = async (requestId) => {
  console.log('postExtraction', extracted);
  if (debug) {
    // save full textract output for debugging
    await uploadDebug(`${requestId}/textract_output.json`, JSON.stringify(extracted));
  }

  // map extracted data
  mapped = mapTextractOutput(extracted);

  // augment and select data for known documentTypes
  processed = processDocument(mapped.keyValues, mapped.rawText);
  metadata.type = processed.documentType;

  // validate processed data
  validated = validateProcessed(processed.extracted);

  // save validated data
  const result = await saveResult(validated, requestId);
  metadata.result = result;

  return validated;
};


module.exports.process = async (event) => {
  const qs = event.queryStringParameters || {};
  debug = Object.hasOwnProperty.call(qs, 'debug');

  if (event.Records && event.Records.length && event.Records[0].Sns) {
    // Resume async execution of the process (invoked from SNS notification event)
    const snsData = JSON.parse(event.Records[0].Sns.Message);
    resumeAsync = { req: snsData.JobTag, job: snsData.JobId };
  }

  const requestId = resumeAsync ? resumeAsync.req : `${new Date().getTime()}_${uniqid()}`;
  metadata.requestId = requestId;
  console.log('requestId', requestId);

  try {
    if (!resumeAsync) {
      authorize(event);

      if (debug) {
        console.log('DEBUG mode');
        // save full event for debugging
        await uploadDebug(`${requestId}/event.json`, JSON.stringify(event));
      }

      // validate and save the file
      object = await upload(event, requestId);

      if (object.type === 'application/pdf') {
        // perform OCR on PDF file *async execution to be continued
        await callTextractAsync(object.key, requestId);
        response = [200, { requestId }];
      } else {
        // perform OCR on IMAGE file *sync execution
        extracted = await callTextractSync(object.key);
        validated = await postExtraction(requestId);
        response = [200, validated];
      }
    } else {
      // continued async execution
      console.log('Resuming execution for requestId', requestId);
      extracted = await retrieveTextractResults(resumeAsync.job);
      validated = await postExtraction(requestId);
      console.log(extracted);
      response = [200, validated];
    }
    console.log('SUCCESS requestId', requestId);
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
        response = [e.statusCode, {
          statusCode: e.statusCode,
          message: e.message,
        }];
        break;

      default:
        response = [500, {
          statusCode: 500,
          message: 'Internal Server Error',
        }];
    }

    console.log('ERROR requestId', requestId);
  }
  // add metadata to response
  if (debug) {
    metadata.debug = {
      object,
      extracted,
      mapped,
      processed,
      validated,
    };
  }

  response[1] = {
    ...response[1],
    ...metadata,
  };

  return respond(response);
};

module.exports.retrieve = async (event) => {

  const params = event.pathParameters || {};
  const { requestId } = params;

  if (!requestId) {
    return respond([400, 'Bad Request']);
  }

  try {
    const result = await retrieveResult(requestId);
    response = [200, result];
  } catch (e) {
    console.error(e);
    response = [404, 'Not Found'];
  }

  response[1] = {
    ...response[1],
    ...metadata,
  };

  return respond(response);
};
