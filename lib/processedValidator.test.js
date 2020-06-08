const validateProcessed = require('./processedValidator');

it('Expect processed data missing fields to be added to errors on bills', async () => {
  const processed = {
    type: 'APS',
    first_name: 'Carlos',
    last_name: 'Jones',
    street_address_line_1: 'Some Address 123',
    street_address_line_2: '',
    city: 'PRESCOTT',
    state: 'AZ',
    zip_code: '86304-6015',
    bill_amount: '$ 214.00',
    bill_date: undefined,
    account_number: '3803231000',
  };

  const response = validateProcessed(processed);
  expect(response.errors).toEqual(expect.arrayContaining(['street_address_line_2', 'bill_date']));
});

it('Expect processed data missing fields to be added to errors on driver licenses', async () => {
  const processed = {
    type: 'AZDL',
    first_name: 'Carlos',
    last_name: 'Jones',
    street_address_line_1: 'Some Address 123',
    street_address_line_2: '',
    city: 'PRESCOTT',
    state: 'AZ',
    zip_code: '86304-6015',
  };

  const response = validateProcessed(processed);
  expect(response.errors).toEqual(expect.arrayContaining(['street_address_line_2']));
});
