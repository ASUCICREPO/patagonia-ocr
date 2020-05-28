const AWS = require('aws-sdk');

const S3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.BUCKET_FOR_BILLS_REGION,
});

module.exports = async (result, requestID) => {

  let savePromises = [];

  // save keyValues as a .csv, and rawText as a .txt
  [{
    name: 'keyValues'
    extension: 'csv',
    mimetype: 'text/csv',
  }, {
    name: 'rawText',
    extension: 'txt',
    mimetype: 'text/plain',
  }]
    .map((data) => {
    const params = {
      Bucket: process.env.BUCKET_FOR_BILLS,
      ContentType: `${data.mimetype}; charset=utf-8`,
      Key: `${requestID}/result_${data.name}.${data.extension}`,
      Body: result[data.name],
    };

    savePromises.push(S3.upload(params).promise());
  });

  return await Promise.all(savePromises);
};
