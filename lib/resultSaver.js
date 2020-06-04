const AWS = require('aws-sdk');

const S3 = new AWS.S3({
  apiVersion: '2006-03-01',
  region: process.env.BUCKET_FOR_DOCUMENTS_REGION,
});

module.exports = async (result, requestID) => {
  const savePromises = [];

  // save keyValues as a .csv
  [{
    name: 'extracted',
    extension: 'csv',
    mimetype: 'text/csv',
  }]
    .forEach((data) => {
      let body = result[data.name];

      // saving just 1 file for now, this switch can be removed...
      /*
      switch (data.extension) {
        case 'csv':
        */
      // simple csv encoding, keys have been normalized
      const keys = Object.keys(body);
      const values = Object.values(body);
      let string = 'key,value\n';
      keys.forEach((key, index) => {
        string += `"${key}","${values[index]}"\n`;
      });
      body = string;
      /*
          break;

        case 'txt':
          body = body.join('\n');
          break;
        default:
      }
      */
      const params = {
        Bucket: process.env.BUCKET_FOR_DOCUMENTS,
        ContentType: `${data.mimetype}; charset=utf-8`,
        Key: `${requestID}/result_${data.name}.${data.extension}`,
        Body: body,
      };

      savePromises.push(S3.upload(params).promise());
    });

  const saved = await Promise.all(savePromises);
  return saved;
};
