const csvParser = require('csv-parse/lib/sync');
const ApiError = require('./ApiError');
const { store, exists } = require('./uploader');

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

  const saved = store.set(`${requestId}/${filename}`, body, 'text/csv; charset=utf-8');
  console.log('saved result', saved);
  return saved;
};

module.exports.retrieveResult = async (requestId) => {
  const json = {};
  try {
    const data = await store.get(`${requestId}/${filename}`);
    const csv = data.Body.toString();
    const array = csvParser(csv, {
      columns: true,
      skip_empty_lines: true,
    });
    array.forEach((line) => {
      json[line.key] = line.value;
    });
  } catch (err) {
    // when object is not found, postExtraction has not run yet
    console.log('retrieveResult cannot find the processed result');
    if (!await exists(requestId)) {
      throw new ApiError('Not Found', 404);
    }
    throw new ApiError('Accepted', 202);
  }
  return json;
};
