'use strict';

module.exports = async (event) => {

  console.log('authorizer', process.env.API_KEYS, event.headers);
  let pass = (
    process.env.API_KEYS &&
    event &&
    event.headers &&
    event.headers['x-api-key'] &&
    process.env.API_KEYS.includes(event.headers['x-api-key'])
  ) || false;
  console.log('authorizer pass', pass, event.headers['x-api-key']);
  return Promise.resolve(pass);
};


