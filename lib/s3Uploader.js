'use strict';

const Busboy = require('busboy');
const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  apiVersion: '2006-03-01'
});

module.exports = async (event) => {
  console.log(event.headers);

  const results = await new Promise((resolve, reject) => {
    const busboy = new Busboy({
      headers: {
        'content-type': event.headers['content-type'] || event.headers['Content-Type']
      }
    });

    const result = [];

    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {

      const uploaded = {};

      file.on('data', data => {
        uploaded.content = data;
      });

      file.on('end', () => {
        if (uploaded.content) {
          uploaded.filename = filename;
          uploaded.contentType = mimetype;
          //uploaded.encoding = encoding;
          //uploaded.fieldname = fieldname;
          result.push(uploaded);
        }
      });
    });

    busboy.on('field', (fieldname, value) => {
      result[fieldname] = value;
    });

    busboy.on('error', error => {
      reject(error);
    });

    busboy.on('finish', () => {
      resolve(result);
    });

    busboy.write(event.body, event.isBase64Encoded ? 'base64' : 'binary');
    busboy.end();
  });

  console.log(results);

  return;
  // @TODO validate formData mime type
  // Initial requirement mentions use of Word Documents .doc/.docx and PDF
  // (Textract only accepts JPG, PNG or PDF only)
  // Some conversion tool may be required

  const params = {
    Bucket: process.env.BUCKET_FOR_BILLS,
    Key: `${uniqid()}_${formData.name}`,
    Body: formData.body
  };

  return s3.putObject(params).promise();

};


