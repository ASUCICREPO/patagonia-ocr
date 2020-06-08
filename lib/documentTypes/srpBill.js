/* eslint-disable camelcase */
module.exports = {

  name: 'SRP',

  matcher: (keyValues, rawText) => {
    const tests = [
      (rawText.find((line) => line === 'srpnet.com')),
      (rawText.find((line) => line === 'Energy Charge')),
      (rawText.find((line) => line === 'Phoenix City Tax')),
      (rawText.find((line) => line === 'kWh')),
    ];

    return tests.filter((t) => !t).length === 0;
  },

  extractor: (keyValues, rawText) => {
    // first name & last name (WARNING splitting full name by space potential inconsistency)
    const serviceFromLineIndex = rawText.findIndex((line) => line.match(/^SERVICE FROM (.*)$/g));
    let fullNameLine;
    let first_name;
    let last_name;
    if (serviceFromLineIndex >= 0) {
      fullNameLine = rawText[serviceFromLineIndex + 1];
      first_name = fullNameLine.split(' ').slice(0, -1).join(' ');
      last_name = fullNameLine.split(' ').slice(-1).join(' ');
    }

    // street address line 1 & 2
    const last5Lines = rawText.slice(-5);
    let street_address_line_1;
    let street_address_line_2;
    let cityStateZipCodeLine = [];

    if (fullNameLine) {
      const lastFullNameLineIndex = last5Lines.findIndex((line) => line === fullNameLine);
      if (lastFullNameLineIndex) {
        street_address_line_1 = last5Lines[lastFullNameLineIndex + 1];
        street_address_line_2 = '';

        // city, state, zip code
        cityStateZipCodeLine = last5Lines[lastFullNameLineIndex + 2].split(' ');
      }
    }
    const [city, state, zip_code] = cityStateZipCodeLine;

    // bill amount
    const bill_amount = keyValues['This Month\'s Charges'];

    // bill date
    const billDateLine = rawText.find((line) => line.match(/^YOUR ACCOUNT SUMMARY AS OF (.*)$/g));
    const bill_date = billDateLine.split(' ').slice(-1)[0];

    // account number
    const accountNumberLine = rawText.find((line) => line.match(/^Account# (.*)$/g));
    const account_number = accountNumberLine.split(' ').slice(-1)[0];

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
