const csvParser = require('csv-parse/lib/sync');
const fs = require('fs').promises;

const processBill = require('./billProcessor');

it('Expect TEP bill to be recognized and parsed', async () => {
  const keyValuesContent = await fs.readFile(
    `${__dirname}/../_samples/tep/keyValues.csv`
  );
  const keyValueRecords = csvParser(keyValuesContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const rawTextContent = await fs.readFile(
    `${__dirname}/../_samples/tep/rawText.txt`
  );

  const response = processBill(keyValueRecords, rawTextContent);
  expect(response.found).toBe(true);
  expect(response.billType).toBe('TEP energy bill');
});
