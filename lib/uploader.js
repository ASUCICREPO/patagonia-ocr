const convertHeic = require('heic-convert');
const AWS = require('aws-sdk');
const parsePost = require('./postParser');

const S3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.BUCKET_FOR_BILLS_REGION,
});

module.exports = async (event, requestID) => {
  const result = await parsePost(event);

  const { filename, type, encoding } = result;
  let { content } = result;

  // only accept files of less than 5MB
  // AWS Textract: limit of 10MB for PNG/JPEG and 500MB for PDF
  // AWS Lambda: limit of 6MB for payload => gives 413 HTTP Status
  // AWS ApiGateway: limit of 10MB for POST size => gives 413 HTTP Status
  if (content.byteLength > (5 * 1024 * 1024)) {
    console.log('content size exceeded');
    return null;
  }

  // only allow these content types
  if (![
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/heif',
    'image/heic',
  ].includes(type)) {
    console.log('content type invalid');
    return null;
  }

  const upload = {
    key: `${requestID}/${filename}`,
  };

  // convert Iphone's HEIF/HEIC format to PNG before upload
  if (['image/heif', 'image/heic'].includes(type)) {
    content = await convertHeic({
      buffer: content,
      format: 'JPEG',
      quality: 1,
    });

    upload.key += '.converted.jpg';
    console.log('converted', filename, upload.key);
  }

  // upload to S3 bucket
  const params = {
    Bucket: process.env.BUCKET_FOR_BILLS,
    ContentType: `${type}; charset=${encoding}`,
    Key: upload.key,
    Body: content,
  };

  const uploaded = await S3.upload(params).promise();
  console.log('uploaded to s3', uploaded);

  return upload.key;
};
