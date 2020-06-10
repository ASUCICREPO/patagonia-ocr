const ApiError = require('./ApiError');

module.exports = (event) => {
  const pass = (
    process.env.API_KEYS
    && event
    && event.headers
    && event.headers['x-api-key']
    && process.env.API_KEYS.split(',').find((k) => k === event.headers['x-api-key']) !== undefined
  ) || false;
  console.log('authorizer', pass, event.headers['x-api-key'], process.env.API_KEYS.split(',').find((k) => k === event.headers['x-api-key']));

  if (!pass) {
    console.log('Unauthorized', event);
    throw new ApiError('Unauthorized', 401);
  }
};
