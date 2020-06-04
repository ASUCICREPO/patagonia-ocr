const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

module.exports = (
  statusCode,
  data,
) => ({
  statusCode,
  headers,
  body: JSON.stringify(data),
});
