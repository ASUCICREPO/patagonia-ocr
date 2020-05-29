const fs = require('fs').promises;
const processDocument = require('./documentProcessor');
const mapTextractOutput = require('./textractMapper');

it('Expect AZ DL to be detected and processed', async () => {
  const mockData = {
    keyValues: { '4d': 'D08954796' },
    rawText: [
      'Arizona',
      'DRIVER LICENSE',
      'USA',
      '9 CLASS D',
      '4d DLN D08954796',
      'Sa END NONE',
      '12 REST B',
      '3 DOB 01/01/1974',
      '1 SAMPLE',
      '2 JELANI',
      '8',
      '123 MAIN ST',
      'PHOENIX, AZ 85007',
      'EXP 04/01/2024 4a ISS 04/01/2016',
      '15 SEX M',
      '18 EYES BRO VETERAN',
      '16 HGT 5\'-09" 19 HAIR BRO',
      '17 WGT 185 lb',
      'ores',
      'Jarmple',
      '01/01/74',
      'DONOR',
      '5 DD 9001A9691S142134',
    ],
  };

  const response = processDocument(mockData.keyValues, mockData.rawText);
  expect(response.found).toBe(true);
  expect(response.documentType).toBe('AZDL');
  // console.log(response.keyValues);
});

it('Expect APS bill to be detected and processed', async () => {
  const textractOutput = await fs.readFile(
    `${__dirname}/../_samples/textract_output_aps_bill.json`,
  );

  const output = JSON.parse(textractOutput.toString());
  const ocr = mapTextractOutput(output);
  const response = processDocument(ocr.keyValues, ocr.rawText);

  console.log(response.keyValues);
  expect(response.found).toBe(true);
  expect(response.documentType).toBe('APS');
});
