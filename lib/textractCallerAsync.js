/* eslint-disable no-constant-condition, no-await-in-loop */
const AWS = require('aws-sdk');
const ApiError = require('./ApiError');
const { store } = require('./uploader');

const Textract = new AWS.Textract({
  apiVersion: '2018-06-27',
  region: process.env.BUCKET_REGION,
});
const filename = 'textract_output.json';

module.exports.callTextractAsync = async (doc, requestId) => {
  const params = {
    ClientRequestToken: requestId,
    DocumentLocation: {
      S3Object: {
        Bucket: process.env.BUCKET,
        Name: doc,
      },
    },
    FeatureTypes: [
      'TABLES',
      'FORMS',
    ],
    NotificationChannel: {
      SNSTopicArn: process.env.SNS_TOPIC_ARN,
      RoleArn: process.env.TEXTRACT_ROLE_ARN,
    },
    JobTag: requestId,
  };
  const call = await Textract.startDocumentAnalysis(params).promise();
  console.log('Async call to Textract', params, call);
  return call.JobId;
};

module.exports.fetchOutput = async (jobId, requestId, _nextToken) => {
  console.log('fetchOutput', jobId, requestId, _nextToken);
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

  switch (JobStatus) {
    case 'IN_PROGRESS':
      console.log('Textract async in progress', jobId);
      throw new ApiError('Accepted', 202);

    case 'FAILED':
      console.log('Textract async failed', jobId);
      throw new ApiError('Failed', 422);

    default:
      console.log('Textract JobStatus', JobStatus, jobId);
  }

  console.log('getDocumentAnalysis response: ', JobStatus, NextToken);
  let textractResult = Blocks;

  if (NextToken) {
    // recursively add subsequent pages
    textractResult += await module.exports.fetchOutput(jobId, requestId, NextToken);
  }

  // save textract result
  await store.set(`${requestId}/${filename}`, JSON.stringify(textractResult));
  return textractResult;
};

module.exports.getStored = async (requestId) => {
  let data = {};
  try {
    data = await store.get(`${requestId}/${filename}`);
    data = data.Body;
  } catch (err) {
    // when object is not found, Textract job is still running
    console.log('getStored cannot find stored, extraction still PENDING');
    throw new ApiError('Accepted', 202);
  }

  return data;
};
