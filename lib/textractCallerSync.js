const AWS = require('aws-sdk');

const Textract = new AWS.Textract({
  apiVersion: '2018-06-27',
  region: process.env.REGION,
});


module.exports = async (doc) => {
  const params = {
    Document: {
      S3Object: {
        Bucket: process.env.BUCKET,
        Name: doc,
      },
    },
    FeatureTypes: [
      'TABLES',
      'FORMS',
    ],
  };

  const response = await Textract.analyzeDocument(params).promise();
  return response.Blocks;
};
