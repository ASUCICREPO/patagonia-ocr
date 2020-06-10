/* eslint-disable no-constant-condition, no-await-in-loop */
const AWS = require('aws-sdk');

const Textract = new AWS.Textract({
  apiVersion: '2018-06-27',
  region: process.env.BUCKET_REGION,
});

module.exports.retrieveTextractResults = async (jobId, _nextToken) => {
  console.log('retrieveTextractResults', jobId, '_nextToken', _nextToken);
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
    textractResult += await module.exports.retrieveTextractResults(jobId, NextToken);
  }

  return textractResult;
};

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
