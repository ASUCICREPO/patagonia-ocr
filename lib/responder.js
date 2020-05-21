module.exports = (
  statusCode,
  data,
  headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
) => ({
  statusCode,
  headers,
  body: JSON.stringify(data),
});
