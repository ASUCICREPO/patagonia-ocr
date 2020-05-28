const fs = require('fs').promises;
const mapTextractOutput = require('./textractMapper');

it('Expect final mapper result to have data', async () => {
  const textractOutput = await fs.readFile(
    `${__dirname}/../_samples/textract_output_aps_bill.json`,
  );

  const output = JSON.parse(textractOutput.toString());

  const result = mapTextractOutput(output);

  // keyValues
  expect(result.keyValues).toBeDefined();
  expect(typeof result.keyValues).toBe('object');
  expect(Object.keys(result.keyValues).length).toBeGreaterThan(10);

  // rawText
  expect(result.rawText).toBeDefined();
  expect(result.rawText.length).toBeGreaterThan(20);
});
