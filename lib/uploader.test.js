const upload = require('./uploader');

it('Expect upload of an unsupported format to fail', async () => {
  const event = {
  };
  const requestID = `${new Date().getTime()}_${uniqid()}`;
  const bill = await upload(event, requestID);

  expect(response.found).toBe(true);
  expect(response.billType).toBe('TEP energy bill');
});
