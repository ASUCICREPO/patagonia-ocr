const AWS = require('aws-sdk');
const csvParser = require('csv-parse/lib/sync');
const { store } = require('./uploader');

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
    's3://',
    process.env.BUCKET,
    '/',
    params.Key,
  ].join('');
};

module.exports.retrieveResult = async (requestId) => {
  try {
    const data = await store.get(`${requestId}/${filename}`)
    const csv = data.Body.toString();
    const array = csvParser(csv, {
      columns: true,
      skip_empty_lines: true,
    });
    const json = {};
    array.forEach((line) => {
      json[line.key] = line.value;
    });
    return json;
  } catch (err) {
    console.log('err', err);
  }

};
