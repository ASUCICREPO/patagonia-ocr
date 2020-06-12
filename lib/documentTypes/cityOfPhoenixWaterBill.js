/* eslint-disable camelcase */
const moment = require('moment');

module.exports = {

  name: 'CITYOFPHOENIXWATER',

  matcher: (keyValues, rawText) => {
    const tests = [
      (rawText.find((line) => line === 'City of Phoenix')),
      (rawText.find((line) => line.toUpperCase().match(/PHOENIX.GOV/g))),
      (rawText.find((line) => line === 'Water Base Fee')),
      (rawText.find((line) => line === 'Your Monthly Water Usage (gallons)')),
    ];

    return tests.filter((t) => !t).length === 0;
  },

  normalizer: {
    date: (string) => {
      const formattable = [
        moment(string, 'MM/DD/YYYY'),
        moment(string, 'M/DD/YYYY'),
        moment(string, 'MM/DD/YY'),
        moment(string, 'M/DD/YY'),
      ].filter((mt) => mt.isValid());

      return formattable.length ? formattable[0].format('MM-DD-YYYY') : string;
    },
  },

  extractor: (keyValues, rawText) => {
    // first name & last name (WARNING splitting full name by space potential inconsistency)
    const [, fullNameLine] = rawText;
    let first_name;
    let last_name;
    if (fullNameLine) {
      first_name = fullNameLine.split(' ').slice(0, -1).join(' ');
      last_name = fullNameLine.split(' ').slice(-1).join(' ');
    }

    // street address line 1 & 2
    const addressLine = rawText.find((line) => line.match(/^Service Address: (.*)$/g)).replace('Service Address: ', '');
    let street_address_line_1;
    let street_address_line_2;
    let city;
    let state;
    let zip_code;
    if (addressLine) {
      const [line1, linecity, linestatezip] = addressLine.split(', ');
      street_address_line_1 = line1;
      street_address_line_2 = '';

      // city, state, zip code
      city = linecity;
      if (linestatezip) {
        const [linestate, linezip] = linestatezip.split(' ');
        state = linestate;
        zip_code = linezip;
      }
    }

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
