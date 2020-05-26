const convertHeic = require('heic-convert');
const AWS = require('aws-sdk');
const parsePost = require('./postParser');

const S3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.BUCKET_FOR_BILLS_REGION,
});

module.exports = async (event, requestID) => {

  const results = await parsePost(event);
  const { content, filename, type } = results[0];

  console.log('parsed', typeof content, content);
  // AWS Textract: limit of 10MB for PNG/JPEG and 500MB for PDF
  // AWS Lambda: limit of 6MB for payload => gives 413 HTTP Status
  // AWS ApiGateway: limit of 10MB for POST size => gives 413 HTTP Status
  if(content.byteLength > (5 * 1024 * 1024)) {
    // only accept files of less than 5MB
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
    content,
  };

  // convert Iphone's HEIF/HEIC format before upload
  if (['image/heif', 'image/heic'].includes(type)) {
    upload.content = await convertHeic({
      buffer: content,
      format: 'PNG',
    });

    upload.key += '.converted.png';
    console.log('converted', filename, upload.key);
  }

  // upload to S3 bucket
  const params = {
    Bucket: process.env.BUCKET_FOR_BILLS,
    Key: upload.key,
    Body: Buffer.from(upload.content),
  };

  const uploaded = await S3.upload(params).promise();
  console.log('uploaded to s3', uploaded);

  return upload.key;
};
