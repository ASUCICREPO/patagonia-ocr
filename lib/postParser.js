const Busboy = require('busboy');

// Busboy with Promises for parsing posted multipart/form-data

module.exports = (event) => new Promise((resolve, reject) => {
  const parser = new Busboy({
    headers: {
      'content-type': event.headers['content-type'] || event.headers['Content-Type'],
    },
  });

  const result = [];

  parser.on('file', (field, file, filename, encoding, mimetype) => {
    const uploaded = {};

    file.on('data', (data) => {
      uploaded.content = data;
    });

    file.on('end', () => {
      if (uploaded.content) {
        uploaded.filename = filename;
        uploaded.type = mimetype;
        // uploaded.encoding = encoding;
        // uploaded.field = field;
        result.push(uploaded);
      }
    });
  });

  parser.on('field', (field, value) => {
    result[field] = value;
  });

  parser.on('error', (error) => {
    reject(error);
  });

  parser.on('finish', () => {
    resolve(result);
  });

  parser.write(event.body, event.isBase64Encoded ? 'base64' : 'binary');
  parser.end();
});
