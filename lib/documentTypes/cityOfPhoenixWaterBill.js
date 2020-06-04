/* eslint-disable camelcase */
module.exports = {

  name: 'CITYOFPHOENIXWATER',

  matcher: (keyValues, rawText) => {
    const tests = [
      (rawText.find((line) => line === 'City of Phoenix')),
      (rawText.find((line) => line.match(/Phoenix.gov/g))),
      (rawText.find((line) => line === 'Water Base Fee')),
      (rawText.find((line) => line === 'Your Monthly Water Usage (gallons)')),
    ];

    return tests.filter((t) => !t).length === 0;
  },

  extractor: (keyValues, rawText) => {
    // first name & last name (WARNING splitting full name by space potential inconsistency)
    const [, fullNameLine] = rawText;
    const first_name = fullNameLine.split(' ').slice(0, -1).join(' ');
    const last_name = fullNameLine.split(' ').slice(-1).join(' ');

    // street address line 1 & 2
    const addressLine = rawText.find((line) => line.match(/^Service Address: (.*)$/g)).replace('Service Address: ', '');
    const street_address_line_1 = addressLine.split(', ')[0];
    const street_address_line_2 = '';

    // city, state, zip code
    const city = addressLine.split(', ')[1];
    const state = addressLine.split(', ')[2].split(' ')[0];
    const zip_code = addressLine.split(', ')[2].split(' ')[1];

    // bill amount
    const bill_amount = keyValues['Total Amount Due'];

    // bill date
    const bill_date = keyValues['Bill Date:'];

    // account number
    const account_number = keyValues['Account Number:'];

    return {
      type: module.exports.name,
      first_name,
      last_name,
      street_address_line_1,
      street_address_line_2,
      city,
      state,
      zip_code,
      bill_amount,
      bill_date,
      account_number,
    };
  },

};
