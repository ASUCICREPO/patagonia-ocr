const convertHeic = require('heic-convert');
const AWS = require('aws-sdk');
const FileType = require('file-type');
const ApiError = require('./ApiError');
const parsePost = require('./uploaderPostParser');

const S3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.BUCKET_REGION,
});

// only accept files of less than 6MB
const maxFileSize = 6; // MB

// Reference:
// AWS ApiGateway: limit of 10MB for POST size
// AWS Lambda: limit of 6MB for payload
// AWS Textract: limit of 10MB for PNG/JPEG and 500MB for PDF

// only accept these file types
const acceptedFileTypes = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/heif',
  'image/heic',
];

// validates, converts if necessary, and uploads posted file
module.exports.upload = async (event, requestId) => {
  const parsed = await parsePost(event);

  const { filename, encoding } = parsed;
  let { content, type } = parsed;

  if (!content.byteLength) {
    console.log('No file provided', event, parsed);
    return Promise.reject(new ApiError('Bad Request (No file provided)', 400));
  }

  if (content.byteLength > (maxFileSize * 1024 * 1024)) {
    console.log('File size exceeded', event, parsed);
    return Promise.reject(new ApiError('Payload Too Large (File size exceeded)', 413));
  }

  // detect mime type
  const detected = await FileType.fromBuffer(content);
  console.log(`Busboy detected ${type}`);
  console.log(`FileType detected ${detected.mime}`);
  type = type !== detected.mime ? detected.mime : type;

  // only allow these content types
  if (!acceptedFileTypes.includes(type)) {
    console.log('File type invalid', type, event, parsed);
    return Promise.reject(new ApiError('Unsupported Media Type (File type invalid)', 415));
  }

  let key = `${requestId}/${filename}`;

  // convert Iphone's HEIF/HEIC format before upload
  if (['image/heif', 'image/heic'].includes(type)) {
    content = await convertHeic({
      buffer: content,
      format: 'JPEG',
      quality: 1,
    });

    key += '.converted.jpg';
    console.log('converted', filename, key);
  }

  // upload to S3 bucket
  const params = {
    Bucket: process.env.BUCKET,
    ContentType: `${type}; charset=${encoding}`,
    Key: key,
    Body: content,
  };

  const uploaded = await S3.upload(params).promise();
  console.log('uploaded to s3', uploaded);

  return {
    key,
    type,
  };
};

// uploads textract output for debugging
module.exports.uploadExtracted = async (extracted, requestId) => {
  const uploaded = await S3.upload({
    Bucket: process.env.BUCKET,
    ContentType: 'application/json',
    Key: `${requestId}/textract_output.json`,
    Body: JSON.stringify(extracted),
  }).promise();
  console.log('uploaded Textract output to s3', uploaded);
};
