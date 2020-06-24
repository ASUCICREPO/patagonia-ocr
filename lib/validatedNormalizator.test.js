/* eslint-disable dot-notation */
const normalizeValidated = require('./validatedNormalizator');
const { normalizer: srpNormalizer } = require('./documentTypes/srpBill');
const { normalizer: apsNormalizer } = require('./documentTypes/apsBill');
const { normalizer: cityOfPhoenixNormalizer } = require('./documentTypes/cityOfPhoenixWaterBill');
const { normalizer: southwestGasNormalizer } = require('./documentTypes/southwestGasBill');

it('Expect AZ diver license data to be normalized', async () => {
  const validated = {
    type: 'Arizona\'s Driver License',
    first_name: 'SAMPLE',
    last_name: 'JELANI',
    street_address_line_1: '123 MAIN ST',
    street_address_line_2: 'PHOENIX, AZ 85007',
    city: 'PHOENIX',
    state: 'AZ',
    zip_code: '85007',
  };

  const response = normalizeValidated(validated);
  expect(response['Type']).toBe('Arizona\'s Driver License');
  expect(response['First Name']).toBe('SAMPLE');
  expect(response['Last Name']).toBe('JELANI');
  expect(response['Street Address Line 1']).toBe('123 MAIN ST');
  expect(response['Street Address Line 2']).toBe('PHOENIX, AZ 85007');
  expect(response['City']).toBe('PHOENIX');
  expect(response['State']).toBe('AZ');
  expect(response['Zip Code']).toBe('85007');
  expect(response.bill_amount).toBe(undefined);
  expect(response.bill_date).toBe(undefined);
  expect(response.account_number).toBe(undefined);
});

it('Expect SRP bill data to be normalized', async () => {
  const validated = {
    type: 'SRP',
    first_name: 'Jane F',
    last_name: 'Ferguson',
    street_address_line_1: '3740 W Goethe AVE',
    street_address_line_2: '',
    city: 'Phoenix',
    state: 'AZ',
    zip_code: '85016-3014',
    bill_amount: '$102.29',
    bill_date: 'May 8, 2020',
    account_number: '651-221-000',
    errors: 'street_address_line_2',
    status: 'SUCCEEDED',
  };

  const response = normalizeValidated(validated, srpNormalizer);
  expect(response['Type']).toBe('SRP');
  expect(response['First Name']).toBe('JANE F');
  expect(response['Last Name']).toBe('FERGUSON');
  expect(response['Street Address Line 1']).toBe('3740 W GOETHE AVE');
  expect(response['Street Address Line 2']).toBe('');
  expect(response['City']).toBe('PHOENIX');
  expect(response['State']).toBe('AZ');
  expect(response['Zip Code']).toBe('85016-3014');
  expect(response['Bill Amount']).toBe('102.29');
  expect(response['Bill Date']).toBe('05-08-2020');
  expect(response['Errors']).toBe('street_address_line_2');
  expect(response['Status']).toBe('SUCCEEDED');
});

it('Expect APS bill data to be normalized', async () => {
  const validated = {
    type: 'APS',
    first_name: 'John A',
    last_name: 'Doe',
    street_address_line_1: '653 E ARAUCARIA LN',
    street_address_line_2: 'PHOENIX AZ 85310-5875',
    city: 'PHOENIX',
    state: 'AZ',
    zip_code: '85310-5875',
    bill_amount: '$ 214.00',
    bill_date: 'May 8, 2020',
    account_number: '4563211000',
    status: 'SUCCEEDED',
  };

  const response = normalizeValidated(validated, apsNormalizer);
  expect(response['Type']).toBe('APS');
  expect(response['First Name']).toBe('JOHN A');
  expect(response['Last Name']).toBe('DOE');
  expect(response['Street Address Line 1']).toBe('653 E ARAUCARIA LN');
  expect(response['Street Address Line 2']).toBe('PHOENIX AZ 85310-5875');
  expect(response['City']).toBe('PHOENIX');
  expect(response['State']).toBe('AZ');
  expect(response['Zip Code']).toBe('85310-5875');
  expect(response['Bill Amount']).toBe('214.00');
  expect(response['Bill Date']).toBe('05-08-2020');
  expect(response['Status']).toBe('SUCCEEDED');
});

it('Expect CITYOFPHOENIXWATER bill data to be normalized', async () => {
  const validated = {
    type: 'City of Phoenix Water',
    first_name: 'MARY A',
    last_name: 'GREGORY',
    street_address_line_1: '2560 E FIFTH AVE',
    street_address_line_2: '',
    city: 'PHOENIX',
    state: 'AZ',
    zip_code: '85016-3014',
    bill_amount: '$53.20',
    bill_date: '05/07/2020',
    account_number: '6372280000',
    errors: 'street_address_line_2',
    status: 'SUCCEEDED',
  };

  const response = normalizeValidated(validated, cityOfPhoenixNormalizer);
  expect(response['Type']).toBe('City of Phoenix Water');
  expect(response['First Name']).toBe('MARY A');
  expect(response['Last Name']).toBe('GREGORY');
  expect(response['Street Address Line 1']).toBe('2560 E FIFTH AVE');
  expect(response['Street Address Line 2']).toBe('');
  expect(response['City']).toBe('PHOENIX');
  expect(response['State']).toBe('AZ');
  expect(response['Zip Code']).toBe('85016-3014');
  expect(response['Bill Amount']).toBe('53.20');
  expect(response['Bill Date']).toBe('05-07-2020');
  expect(response['Errors']).toBe('street_address_line_2');
  expect(response['Status']).toBe('SUCCEEDED');
});

it('Expect SOUTHWESTGAS bill data to be normalized', async () => {
  const validated = {
    type: 'Southwest Gas',
    first_name: 'CHARLES',
    last_name: 'DOE',
    street_address_line_1: '2561 W ARCADIA LN 85310',
    street_address_line_2: '',
    city: 'PHOENIX',
    state: 'AZ',
    zip_code: '85310',
    bill_amount: '$33.72',
    bill_date: '05/01/20',
    account_number: '421-6415508-002',
    errors: 'street_address_line_2',
    status: 'SUCCEEDED',
  };

  const response = normalizeValidated(validated, southwestGasNormalizer);
  expect(response['Type']).toBe('Southwest Gas');
  expect(response['First Name']).toBe('CHARLES');
  expect(response['Last Name']).toBe('DOE');
  expect(response['Street Address Line 1']).toBe('2561 W ARCADIA LN 85310');
  expect(response['Street Address Line 2']).toBe('');
  expect(response['City']).toBe('PHOENIX');
  expect(response['State']).toBe('AZ');
  expect(response['Zip Code']).toBe('85310');
  expect(response['Bill Amount']).toBe('33.72');
  expect(response['Bill Date']).toBe('05-01-2020');
  expect(response['Errors']).toBe('street_address_line_2');
  expect(response['Status']).toBe('SUCCEEDED');
});
