const Busboy = require('busboy');

// Busboy with Promises for parsing posted multipart/form-data
module.exports = (event) => new Promise((resolve, reject) => {
  const parser = new Busboy({
    headers: {
      'content-type': event.headers['content-type'] ? event.headers['content-type'] : event.headers['Content-Type'],
    },
    limits: {
      files: 1,
    },
  });

  const result = {
    chunks: [],
    size: 0,
  };

  parser.on('file', (fieldname, stream, filename, encoding, mimetype) => {
    stream.on('data', (chunk) => {
      result.chunks[result.chunks.length] = chunk;
      result.size += chunk.length;
    });

    stream.on('end', () => {
      result.content = Buffer.concat(result.chunks, result.size);
      delete result.chunks;
      result.filename = filename;
      result.encoding = encoding;
      result.type = mimetype;
    });
  });

  parser.on('field', (fieldname, value) => {
    result[fieldname] = value;
  });

  parser.on('error', (error) => reject(error));
  parser.on('finish', () => {
    resolve(result);
  });

  parser.write(event.body, event.isBase64Encoded ? 'base64' : 'binary');
  parser.end();
});
