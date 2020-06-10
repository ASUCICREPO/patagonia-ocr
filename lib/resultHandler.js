const AWS = require('aws-sdk');

const S3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.BUCKET_REGION,
});

const filename = 'result.csv';

module.exports.saveResult = async (result, requestId) => {
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
    Key: `${requestId}/${filename}`,
    Body: body,
  };

  const saved = await S3.upload(params).promise();

  console.log('saved result', saved);
  return [
    's3://'
    process.env.BUCKET,
    '/',
    params.Key,
  ].join('');
};

module.exports.retrieveResult = async (requestId) => {
  const params = {
    Bucket: process.env.BUCKET,
    Key: `${requestId}/${filename}`,
  };

  const json = {};
  const data = await S3.getObject(params).promise();
  const csv = data.Body.toString();
  const array = csv.split('\n');
  array.shift();
  array.forEach((line) => {
    const [key, value] = line.replace(/"/g, '').split(',');
    json[key] = value;
  });
  return json;
};
