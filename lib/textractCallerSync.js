const AWS = require('aws-sdk');
const mapTextractOutput = require('./textractMapper');

const Textract = new AWS.Textract({
  apiVersion: '2018-06-27',
  region: process.env.BUCKET_FOR_BILLS_REGION,
});

module.exports = async (bill) => {
  const params = {
    Document: {
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

  // const response = await Textract.detectDocumentText(params).promise();
  const ocr = await Textract.analyzeDocument(params).promise();
  const mapped = await mapTextractOutput(ocr);
  return mapped;
};
