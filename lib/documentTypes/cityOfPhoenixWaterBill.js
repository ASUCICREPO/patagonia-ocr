/* eslint-disable camelcase */
const moment = require('moment');
const stringSimilarity = require('string-similarity');

module.exports = {

  name: 'City of Phoenix Water',

  matcher: (keyValues, rawText) => {
    const tests = [
      (rawText.find((line) => line === 'City of Phoenix')),
      (rawText.find((line) => line.toUpperCase().match(/PHOENIX.GOV/g))),
      (rawText.find((line) => line === 'Water Base Fee')),
      (rawText.find((line) => line === 'Your Monthly Water Usage (gallons)')),
    ];

    return tests.filter((t) => !t).length <= 1;
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
    const keys = Object.keys(keyValues);
    const first5Lines = rawText.slice(0, 5);
    let fullName;
    let first_name;
    let last_name;

    fullName = first5Lines.find((line) => (
      !line.match(/City of Phoenix/gi)
      && !line.match(/City Services Bill?/gi)
      && !line.match(/\d+/g)
      && line.toUpperCase() === line
    ));

    if (fullName) {
      // first name & last name (dropping anything between first and last words)
      first_name = fullName.split(' ').slice(0, 1).join(' ');
      last_name = fullName.split(' ').slice(-1).join(' ');
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
    let bill_amount = keyValues[keys[stringSimilarity.findBestMatch(
      'Total Amount Due',
      keys,
    ).bestMatchIndex]];
    if (!bill_amount || !bill_amount.length) {
      bill_amount = keyValues[keys[stringSimilarity.findBestMatch(
        'Total amount due:',
        keys,
      ).bestMatchIndex]];
    }

    // bill date
    const billDateIndex = stringSimilarity.findBestMatch(
      'Due Date',
      keys,
    ).bestMatchIndex;
    let bill_date = keyValues[keys[billDateIndex]];

    if (!bill_date
      || !bill_date.length
      || keys[billDateIndex].match(/Bill Date/gi)
      || !bill_date.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/g)) {
      const lineWithDueDate = rawText.findIndex((line) => line.match(/^Due Date$/g));
      bill_date = rawText.slice(lineWithDueDate - 5, lineWithDueDate + 5).filter((line) => (
        line.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/g)
      ));
      bill_date = bill_date.length ? bill_date[0] : '';
    }

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
