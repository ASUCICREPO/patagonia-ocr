const fs = require('fs').promises;
const normalizeValidated = require('./validatedNormalizator');

it('Expect AZ diver license data to be normalized', async () => {
  const validated = {
    type: 'AZDL',
    first_name: 'SAMPLE',
    last_name: 'JELANI',
    street_address_line_1: '123 MAIN ST',
    street_address_line_2: 'PHOENIX, AZ 85007',
    city: 'PHOENIX',
    state: 'AZ',
    zip_code: '85007',
  };

  const response = normalizeValidated(validated);

  expect(response.type).toBe('AZDL');
  expect(response.first_name).toBe('SAMPLE');
  expect(response.last_name).toBe('JELANI');
  expect(response.street_address_line_1).toBe('123 MAIN ST');
  expect(response.street_address_line_2).toBe('PHOENIX, AZ 85007');
  expect(response.city).toBe('PHOENIX');
  expect(response.state).toBe('AZ');
  expect(response.zip_code).toBe('85007');
});

it('Expect SRP bill data to be normalized', async () => {
  const normalizer = require('./documentTypes/srpBill').normalizer;
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
    status:  'SUCCEEDED',
  };

  const response = normalizeValidated(validated, normalizer);
  expect(response.type).toBe('SRP');
  expect(response.first_name).toBe('JANE F');
  expect(response.last_name).toBe('FERGUSON');
  expect(response.street_address_line_1).toBe('3740 W GOETHE AVE');
  expect(response.street_address_line_2).toBe('');
  expect(response.city).toBe('PHOENIX');
  expect(response.state).toBe('AZ');
  expect(response.zip_code).toBe('85016-3014');
  expect(response.bill_amount).toBe('102.29');
  expect(response.bill_date).toBe('05-08-2020');
  expect(response.errors).toBe('street_address_line_2');
  expect(response.status).toBe('SUCCEEDED');
});

it('Expect APS bill data to be normalized', async () => {
  const normalizer = require('./documentTypes/apsBill').normalizer;
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

  const response = normalizeValidated(validated, normalizer);
  expect(response.type).toBe('APS');
  expect(response.first_name).toBe('JOHN A');
  expect(response.last_name).toBe('DOE');
  expect(response.street_address_line_1).toBe('653 E ARAUCARIA LN');
  expect(response.street_address_line_2).toBe('PHOENIX AZ 85310-5875');
  expect(response.city).toBe('PHOENIX');
  expect(response.state).toBe('AZ');
  expect(response.zip_code).toBe('85310-5875');
  expect(response.bill_amount).toBe('214.00');
  expect(response.bill_date).toBe('05-08-2020');
  expect(response.status).toBe('SUCCEEDED');
});

it('Expect CITYOFPHOENIXWATER bill data to be normalized', async () => {
  const normalizer = require('./documentTypes/cityOfPhoenixWaterBill').normalizer;
  const validated = {
    type: 'CITYOFPHOENIXWATER',
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

  const response = normalizeValidated(validated, normalizer);
  expect(response.type).toBe('CITYOFPHOENIXWATER');
  expect(response.first_name).toBe('MARY A');
  expect(response.last_name).toBe('GREGORY');
  expect(response.street_address_line_1).toBe('2560 E FIFTH AVE');
  expect(response.street_address_line_2).toBe('');
  expect(response.city).toBe('PHOENIX');
  expect(response.state).toBe('AZ');
  expect(response.zip_code).toBe('85016-3014');
  expect(response.bill_amount).toBe('53.20');
  expect(response.bill_date).toBe('05-07-2020');
  expect(response.errors).toBe('street_address_line_2');
  expect(response.status).toBe('SUCCEEDED');
});

it('Expect SOUTHWESTGAS bill data to be normalized', async () => {
  const normalizer = require('./documentTypes/southwestGasBill').normalizer;
  const validated = {
    type: 'SOUTHWESTGAS',
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

  const response = normalizeValidated(validated, normalizer);
  expect(response.type).toBe('SOUTHWESTGAS');
  expect(response.first_name).toBe('CHARLES');
  expect(response.last_name).toBe('DOE');
  expect(response.street_address_line_1).toBe('2561 W ARCADIA LN 85310');
  expect(response.street_address_line_2).toBe('');
  expect(response.city).toBe('PHOENIX');
  expect(response.state).toBe('AZ');
  expect(response.zip_code).toBe('85310');
  expect(response.bill_amount).toBe('33.72');
  expect(response.bill_date).toBe('05-01-2020');
  expect(response.errors).toBe('street_address_line_2');
  expect(response.status).toBe('SUCCEEDED');
});

