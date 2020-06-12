const ApiError = require('./ApiError');

module.exports = (event) => {
  const pass = (
    process.env.API_KEYS
    && event
    && event.headers
    && event.headers['x-api-key']
    && process.env.API_KEYS.split(',').find((k) => k === event.headers['x-api-key']) !== undefined
  ) || false;

  if (!pass) {
    console.log('Unauthorized', event);
    throw new ApiError('Unauthorized', 401);
  }
};
