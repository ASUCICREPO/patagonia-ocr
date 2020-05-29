/* eslint-disable no-constant-condition, no-await-in-loop */
const AWS = require('aws-sdk');
const ApiError = require('./ApiError');
const mapTextractOutput = require('./textractMapper');

const Textract = new AWS.Textract({
  apiVersion: '2018-06-27',
  region: process.env.BUCKET_FOR_DOCUMENTS_REGION,
});

const getCompleteDocumentAnalysis = async (jobId, _nextToken) => {
  console.log('getCompleteDocumentAnalysis', jobId, '_nextToken', _nextToken);
  const params = {
    JobId: jobId,
    NextToken: _nextToken,
  };

  if (!_nextToken) {
    delete params.NextToken;
  }

  const data = await Textract.getDocumentAnalysis(params).promise();
  const {
    JobStatus,
    NextToken,
    Blocks,
  } = data;

  if (JobStatus !== 'SUCCEEDED') {
    return data;
  }

  console.log('getDocumentAnalysis response: ', JobStatus, NextToken);
  let textractResult = Blocks;

  if (NextToken) {
    textractResult += await getCompleteDocumentAnalysis(jobId, NextToken);
  }

  return textractResult;
};

let exponentialBackoff = 800;
const sleep = async () => new Promise((resolve) => setTimeout(resolve, exponentialBackoff));

const waitForAsyncExecution = async (jobId) => {
  let data;

  while (true) {
    data = await getCompleteDocumentAnalysis(jobId);
    const {
      JobStatus: status,
      StatusMessage: message,
    } = data;

    console.log('Async Call to Textract (status, jobId, data)', status, jobId, data);

    if (exponentialBackoff <= 51200) {
      console.log('Retry', exponentialBackoff);
      await sleep();
      exponentialBackoff *= 2;
    } else {
      console.log(`ERROR 504 Async OCR TIMEOUT jobId: ${jobId}`);
      return Promise.reject(new ApiError('Gateway Timeout (Async OCR Wait Timeout)', 504));
    }

    if (status === 'CANCELLED'
      || status === 'FAILED') {
      console.log(`ERROR 422 Async OCR ${status}`, message);
      return Promise.reject(new ApiError('Unprocessable Entity (OCR Failed)', 422));
    }

    if (status === 'SUCCEEDED') {
      return data;
    }
  }
};

module.exports = async (doc) => {
  const params = {
    DocumentLocation: {
      S3Object: {
        Bucket: process.env.BUCKET_FOR_DOCUMENTS,
        Name: doc,
      },
    },
    FeatureTypes: [
      'TABLES',
      'FORMS',
    ],
  };

  const call = await Textract.startDocumentAnalysis(params).promise();
  const output = await waitForAsyncExecution(call.JobId);
  const mapped = mapTextractOutput(output);
  return mapped;
};
