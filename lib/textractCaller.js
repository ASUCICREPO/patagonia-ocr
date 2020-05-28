const AWS = require('aws-sdk');
const mapTextractOutput = require('./textractMapper');

const Textract = new AWS.Textract({
  apiVersion: '2018-06-27',
  region: process.env.BUCKET_FOR_BILLS_REGION,
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

  console.log('getDocumentAnalysis response', JobStatus, NextToken);
  let textractResult = Blocks;

  if (NextToken) {
    textractResult += await getCompleteDocumentAnalysis(jobId, NextToken);
  }

  return textractResult;
};

let exponentialBackoff = 800;
const sleep = async () => new Promise((resolve) => setTimeout(resolve, exponentialBackoff));

const waitForAsyncExecution = async (jobId) => {
  console.log('waitForAsyncExecution');
  let data;
  let status;

  while (true) {
    data = await getCompleteDocumentAnalysis(jobId);
    status = data.JobStatus;

    console.log('Async Call to Textract (status, jobId, data)', status, jobId, data);

    if (exponentialBackoff <= 51200) {
      console.log('Retry', exponentialBackoff);
      await sleep();
      exponentialBackoff *= 2;
    } else {
      console.log(`TIMEOUT waiting for Textract job ${jobId}`);
      return null;
    }

    if (status === 'CANCELLED'
      || status === 'FAILED') {
      return null;
    }

    if (status === 'SUCCEEDED') {
      return data;
    }
  }
};

module.exports = async (bill) => {
  const params = {
    DocumentLocation: {
      S3Object: {
        Bucket: process.env.BUCKET_FOR_BILLS,
        Name: bill,
      },
    },
    FeatureTypes: [
      'TABLES',
      'FORMS',
    ],
  };

  const start = await Textract.startDocumentAnalysis(params).promise();
  const response = await waitForAsyncExecution(start.JobId);
  const output = mapTextractOutput(response);
  return output;
};
