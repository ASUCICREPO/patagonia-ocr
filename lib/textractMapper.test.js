const mapTextractOutput = require('./textractMapper');
const fs = require('fs').promises;

it('Expect upload of an unsupported format to fail', async () => {

  const textractOutput = await fs.readFile(
    `${__dirname}/../_samples/data/bill_aps_textract_output.json`,
  );

  const output = JSON.parse(textractOutput.toString());

  const result = mapTextractOutput(output);
console.log(result.keyValues);
  // keyValues
  expect(result.keyValues).toBeDefined();

  // rawText
  expect(result.rawText).toBeDefined();
  expect(typeof result.rawText).toBe('string');
  expect(result.rawText.length).toBeGreaterThan(20);
});
