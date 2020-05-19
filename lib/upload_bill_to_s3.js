'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  apiVersion: '2006-03-01'
});

module.exports = async (file) => {

  console.log(file);

  // @TODO validate file mime type
  // Initial requirement mentions use of Word Documents .doc/.docx and PDF
  // (Textract only accepts JPG, PNG or PDF only)
  // Some conversion tool may be required

  const params = {
    Bucket: process.env.BUCKET_FOR_BILLS,
    Key: `${uniqid()}_${file.name}`,
    Body: file.body
  };

  return s3.putObject(params).promise();

};


