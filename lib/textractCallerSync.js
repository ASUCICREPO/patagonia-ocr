const AWS = require('aws-sdk');
const mapTextractOutput = require('./textractMapper');

const Textract = new AWS.Textract({
  apiVersion: '2018-06-27',
  region: process.env.BUCKET_FOR_DOCUMENTS_REGION,
});

module.exports = async (doc) => {
  const params = {
    Document: {
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

  const output = await Textract.analyzeDocument(params).promise();
  const mapped = await mapTextractOutput(output);
  return mapped;
};
