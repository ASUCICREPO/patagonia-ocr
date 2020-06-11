const uniqid = require('uniqid');

const authorize = require('./lib/authorizer');
const { upload, uploadDebug } = require('./lib/uploader');
const { callTextractAsync, retrieveTextractResults } = require('./lib/textractCallerAsync');
const callTextractSync = require('./lib/textractCallerSync');
const mapTextractOutput = require('./lib/textractMapper');
const processDocument = require('./lib/documentProcessor');
const validateProcessed = require('./lib/processedValidator');
const normalizeValidated = require('./lib/validatedNormalizator');
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
let normalized = {};

const postExtraction = async (requestId) => {
  if (debug) {
    console.log('postExtraction', extracted);
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

  normalized = normalizeValidated(validated, processed.normalizer);

  // save normalized data
  await saveResult(normalized, requestId);

  return normalized;
};

module.exports.process = async (event) => {
  const qs = event.queryStringParameters || {};
  debug = Object.hasOwnProperty.call(qs, 'debug');

  if (event.Records && event.Records.length && event.Records[0].Sns) {
    // Resume async execution of the process (invoked from SNS notification event)
    // after Textract async PDF analysis is finished
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
        metadata.status = 'PENDING';
        response = [202, { requestId }];
      } else {
        // perform OCR on IMAGE file *sync execution
        extracted = await callTextractSync(object.key);
        normalized = await postExtraction(requestId);
        metadata.status = 'SUCCEEDED';
        response = [200, normalized];
      }
    } else {
      // continued async execution
      console.log('Resuming async execution', requestId);
      extracted = await retrieveTextractResults(resumeAsync.job);
      normalized = await postExtraction(requestId);
      metadata.status = 'SUCCEEDED';
      response = [200, normalized];
    }
    console.log('SUCCEEDED requestId', requestId);
  } catch (e) {
    console.error(e); // log all catched errors

    // respond the request with a registered ERROR
    switch (e.statusCode) {
      case 400: // Bad Request
      case 401: // Unauthorized
      case 413: // Payload Too Large
      case 415: // Unsupported Media Type
      case 501: // Not Implemented
        metadata.status = 'FAILED';
        response = [e.statusCode, {
          statusCode: e.statusCode,
          message: e.message,
        }];
        break;

      default:
        metadata.status = 'FAILED';
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
      normalized,
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
    metadata.status = 'SUCCEEDED';
    response = [200, result];
  } catch (e) {
    console.error(e);

    // respond the request with a registered ERROR
    switch (e.statusCode) {
      case 202: // Accepted
        metadata.status = 'PENDING';
        response = [e.statusCode, {
          statusCode: e.statusCode,
          message: 'Accepted',
        }];
        break;

      case 403: // Forbidden
      case 404: // Not Found
        metadata.status = 'NOT_FOUND';
        response = [e.statusCode, {
          statusCode: e.statusCode,
          message: 'Not Found',
        }];
        break;

      case 422: // Unprocessable Entity
        metadata.status = 'FAILED';
        response = [e.statusCode, {
          statusCode: e.statusCode,
          message: e.message,
        }];
        break;

      default:
        metadata.status = 'FAILED';
        response = [500, {
          statusCode: 500,
          message: 'Internal Server Error',
        }];
    }
  }

  response[1] = {
    ...response[1],
    ...metadata,
  };

  return respond(response);
};
