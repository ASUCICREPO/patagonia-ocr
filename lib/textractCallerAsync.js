/* eslint-disable no-constant-condition, no-await-in-loop */
const AWS = require('aws-sdk');
const ApiError = require('./ApiError');
const { store } = require('./uploader');

const Textract = new AWS.Textract({
  apiVersion: '2018-06-27',
  region: process.env.REGION,
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
  const { JobId: jobId } = await Textract.startDocumentAnalysis(params).promise();
  console.log('Async call to Textract', doc, jobId);
  return jobId;
};

const onOutput = (status) => {
  switch (status) {
    case 'IN_PROGRESS':
      console.log('Textract async in progress');
      throw new ApiError('Accepted', 202);

    case 'FAILED':
      console.log('Textract async failed');
      throw new ApiError('Failed', 422);

    default:
      console.log('Textract JobStatus', status);
  }
};

const fetchAllPages = async (jobId) => {
  const pages = [];
  const params = {
    JobId: jobId,
  };
  let token;

  const data = await Textract.getDocumentAnalysis(params).promise();
  onOutput(data.JobStatus);
  console.log('first page', data.Blocks.length);
  pages.push(data);

  if (data.NextToken) {
    token = data.NextToken;
  }

  while (token) {
    // add subsequent pages
    const page = await Textract.getDocumentAnalysis({
      ...params,
      NextToken: token,
    }).promise();
    console.log('next page', page.Blocks.length);

    pages.push(page);
    token = !page.NextToken ? null : page.NextToken;
  }

  // sum all blocks together on first page of results
  const out = pages[0];
  for (let i = 1; i < pages.length; i += 1) {
    out.Blocks.push(...pages[i].Blocks);
  }
  console.log('in object', out.Blocks.length);

  return out;
};

module.exports.fetchAndStoreOutput = async (jobId, requestId) => {
  console.log('fetchAndStoreOutput', jobId, requestId);
  // fetch output from Textract API
  const output = await fetchAllPages(jobId);

  // save textract result
  await store.set(`${requestId}/${filename}`, JSON.stringify(output));

  return output.Blocks;
};

module.exports.getStored = async (requestId) => {
  let data = {};
  try {
    data = await store.get(`${requestId}/${filename}`);
  } catch (err) {
    // Textract job is still running, return PENDING as an ERROR
    console.log('getStored cannot find stored extraction, still PENDING');
    throw new ApiError('Accepted', 202);
  }

  const string = data.Body.toString('utf-8');
  const json = JSON.parse(string);
  onOutput(json.JobStatus);

  return json.Blocks;
};
