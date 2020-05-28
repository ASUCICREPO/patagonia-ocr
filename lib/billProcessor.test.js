const processBill = require('./billProcessor');
const mapTextractOutput = require('./textractMapper');
const fs = require('fs').promises;

it('Expect aps bill to be recognized and parsed', async () => {
  const textractOutput = await fs.readFile(
    `${__dirname}/../_samples/textract_output_aps_bill.json`,
  );

  const output = JSON.parse(textractOutput.toString());
  const ocr = mapTextractOutput(output);
  const response = processBill(ocr.keyValues, ocr.rawText);

  expect(response.found).toBe(true);
  expect(response.billType).toBe('aps energy bill');
});
