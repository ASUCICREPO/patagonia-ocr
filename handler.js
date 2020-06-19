/* eslint-disable dot-notation */
const uniqid = require('uniqid');

const ApiError = require('./lib/ApiError');
const authorize = require('./lib/authorizer');
const { upload, store } = require('./lib/uploader');
const { callTextractAsync, fetchAndStoreOutput, getStored } = require('./lib/textractCallerAsync');
const callTextractSync = require('./lib/textractCallerSync');
const mapTextractOutput = require('./lib/textractMapper');
const processDocument = require('./lib/documentProcessor');
const validateProcessed = require('./lib/processedValidator');
const normalizeValidated = require('./lib/validatedNormalizator');
const { saveResult, retrieveResult } = require('./lib/resultHandler');
const respond = require('./lib/responder');

const postExtraction = async (dataExtracted, requestId, debug) => {
  // map raw extracted output
  const dataMapped = mapTextractOutput(dataExtracted);

  if (debug) {
    console.log('dataMapped', dataMapped);
    await store.set(`${requestId}/_1_mapped.json`, JSON.stringify(dataMapped));
  }

  // augment and select data for known documentTypes
  const dataProcessed = processDocument(dataMapped.keyValues, dataMapped.rawText);
  if (debug) {
    await store.set(`${requestId}/_2_processed.json`, JSON.stringify(dataProcessed));
  }

  // validate processed data
  const dataValidated = validateProcessed(dataProcessed.extracted);
  if (debug) {
    await store.set(`${requestId}/_3_validated.json`, JSON.stringify(dataValidated));
  }

  // normalize values formatting
  const dataNormalized = normalizeValidated(dataValidated, dataProcessed.normalizer);
  if (debug) {
    await store.set(`${requestId}/_4_normalized.json`, JSON.stringify(dataNormalized));
    // output mapped data on debug
    dataNormalized.Mapped = dataMapped;
  }

  // save normalized data
  await saveResult(dataNormalized, requestId);

  return dataNormalized;
};

module.exports.process = async (event) => {
  let debug = false;
  let response = [];
  const metadata = {};
  let resumeAsync = false;

  let object = {};
  let extracted = {};
  let normalized = {};

  const qs = event.queryStringParameters || {};
  debug = Object.hasOwnProperty.call(qs, 'debug');

  if (event.Records && event.Records.length && event.Records[0].Sns) {
    // Resume async execution of the process (invoked from SNS notification event)
    // after Textract async PDF analysis is finished
    const snsData = JSON.parse(event.Records[0].Sns.Message);
    resumeAsync = { req: snsData.JobTag, job: snsData.JobId };
  }

  const requestId = resumeAsync ? resumeAsync.req : `${new Date().getTime()}_${uniqid()}`;
  metadata['RequestId'] = requestId;

  try {
    if (!resumeAsync) {
      authorize(event);

      console.log('STARTED requestId', requestId, {
        BUCKET: process.env.BUCKET,
        REGION: process.env.REGION,
        SNS_TOPIC_ARN: process.env.SNS_TOPIC_ARN,
        TEXTRACT_ROLE_ARN: process.env.TEXTRACT_ROLE_ARN,
      });

      if (debug) {
        console.log('DEBUG mode');
        // save full event for debugging
        await store.set(`${requestId}/event.json`, JSON.stringify(event));
      }

      // validate and save the file
      object = await upload(event, requestId);

      if (object.type === 'application/pdf') {
        // perform OCR on PDF file *async execution to be continued
        await callTextractAsync(object.key, requestId);
        // Textract job started, return PENDING as an ERROR
        throw new ApiError('Accepted', 202);
      } else {
        // perform OCR on IMAGE file *sync execution
        extracted = await callTextractSync(object.key);
        normalized = await postExtraction(extracted, requestId, debug);
        metadata['Status'] = 'SUCCEEDED';
        response = [200, normalized];
      }
    } else {
      // continued async execution
      console.log('Resuming async execution', requestId);

      // fetch output from Textract API
      console.log('Fetching Textract output', resumeAsync.job);
      extracted = await fetchAndStoreOutput(resumeAsync.job, requestId);

      // save full Textract output
      console.log('ENDED requestId', requestId);
      return respond([200, {}]);
    }
  } catch (e) {
    console.error(e); // log all catched errors

    // respond the request with a registered ERROR
    switch (e.statusCode) {
      // Textract job started
      case 202:
        metadata['Status'] = 'PENDING';
        response = [e.statusCode, {}];
        break;

      case 400: // Bad Request
        response = [e.statusCode, {
          Message: 'Bad Request',
        }];
        break;

      case 401: // Unauthorized
      case 413: // Payload Too Large
      case 415: // Unsupported Media Type
      case 422: // Unprocessable Entity
      case 501: // Not Implemented
        response = [e.statusCode, {
          Message: e.message,
        }];
        break;

      default:
        metadata['Status'] = 'FAILED';
        response = [500, {
          Message: 'Internal Server Error',
        }];
    }

    console.log('ERROR requestId', requestId);
  }

  if (debug) {
    // add more data for debugging
    metadata.Debug = {
      Object: object,
    };

    if (response[1].Mapped) {
      // mapped is available in normalized, move to Debug node
      metadata.Debug.Mapped = response[1].Mapped;
      delete response[1].Mapped;
    }

    if (object.type !== 'application/pdf') {
      metadata.Debug.Extracted = extracted;
      metadata.Debug.Normalized = normalized;
    }
  }

  // add metadata to response
  response[1] = {
    ...response[1],
    ...metadata,
  };

  console.log('ENDED requestId', requestId);
  return respond(response);
};

module.exports.retrieve = async (event) => {
  let debug = false;
  let response = [];
  const metadata = {};
  let extracted;
  let normalized;

  const qs = event.queryStringParameters || {};
  debug = Object.hasOwnProperty.call(qs, 'debug');

  const params = event.pathParameters || {};
  const { requestId } = params;

  if (!requestId) {
    return respond([400, {
      Message: 'Bad Request',
    }]);
  }
  metadata['RequestId'] = requestId;

  try {
    console.log('STARTED requestId', requestId, {
      BUCKET: process.env.BUCKET,
      REGION: process.env.REGION,
    });

    if (debug) {
      console.log('DEBUG mode');
    }

    authorize(event);
    const result = await retrieveResult(requestId);

    if (!result) {
      // a result still needs to be processed
      extracted = await getStored(requestId);

      // run process with stored extracted data
      normalized = await postExtraction(extracted, requestId, debug);

      metadata['Status'] = 'SUCCEEDED';
      response = [200, normalized];
    } else {
      // already processed, return found result
      metadata['Status'] = 'SUCCEEDED';
      response = [200, result];
    }
  } catch (e) {
    console.error(e);

    // respond the request with a registered ERROR
    switch (e.statusCode) {
      // Textract job is still running
      case 202:
        metadata['Status'] = 'PENDING';
        response = [e.statusCode, {}];
        break;

        // requestId does not exist
      case 404: // Not Found
        metadata['Status'] = 'NOT_FOUND';
        response = [e.statusCode, {}];
        break;

        // postExtraction failed
      case 401: // Unauthorized
        response = [e.statusCode, {
          Message: 'Missing Authentication Token',
        }];
        break;

      case 422: // Unprocessable Entity
      case 501: // Not Implemented
        response = [e.statusCode, {
          Message: e.message,
        }];
        break;

      default:
        metadata['Status'] = 'FAILED';
        response = [500, {
          Message: 'Internal Server Error',
        }];
    }
  }

  response[1] = {
    ...response[1],
    ...metadata,
  };

  console.log('ENDED requestId', requestId);
  return respond(response);
};
