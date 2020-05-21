module.exports = (event) => {
    const pass = (
      process.env.API_KEYS
      && event
      && event.headers
      && event.headers['x-api-key']
      && process.env.API_KEYS.includes(event.headers['x-api-key'])
    ) || false;

  return Promise.resolve(pass);
};
