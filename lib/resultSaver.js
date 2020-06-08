const AWS = require('aws-sdk');

const S3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.BUCKET_REGION,
});

module.exports = async (result, requestId) => {
  // save keyValues as a .csv
  let body = result;
  const keys = Object.keys(body);
  const values = Object.values(body);
  let string = 'key,value\n';
  keys.forEach((key, index) => {
    string += `"${key}","${values[index]}"\n`;
  });
  body = string;
  const params = {
    Bucket: process.env.BUCKET,
    ContentType: 'text/csv; charset=utf-8',
    Key: `${requestId}/result_extracted.csv`,
    Body: body,
  };

  return S3.upload(params).promise();
};
