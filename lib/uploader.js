const convertHeic = require('heic-convert');
const AWS = require('aws-sdk');

const parsePost = require('./postParser');

const S3 = new AWS.S3({
  apiVersion: '2006-03-01',
});


module.exports = async (event, requestID) => {
  const results = await parsePost(event);
  const { content, filename, type } = results[0];

  // only allow these content types
  if (![
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/heif',
    'image/heic',
  ].includes(type)) {
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
    Body: upload.content,
  };
  console.log('uploading to s3', params);

  return await S3.putObject(params).promise();
};
