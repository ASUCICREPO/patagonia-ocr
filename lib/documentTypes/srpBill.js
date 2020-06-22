/* eslint-disable camelcase */
const moment = require('moment');

module.exports = {

  name: 'SRP',

  matcher: (keyValues, rawText) => {
    const tests = [
      (rawText.find((line) => line === 'srpnet.com')),
      (rawText.find((line) => line.match(/Energy Charge/g))),
      (rawText.find((line) => line === 'Phoenix City Tax')),
      (rawText.find((line) => line === 'kWh')),
    ];

    return tests.filter((t) => !t).length <= 1;
  },

  normalizer: {
    date: (string) => {
      const formattable = [
        moment(string, 'MMM D, YYYY'),
        moment(string, 'MMM D, YY'),
      ].filter((mt) => mt.isValid());

      return formattable.length ? formattable[0].format('MM-DD-YYYY') : string;
    },
  },

  extractor: (keyValues, rawText) => {
    const serviceFromLineIndex = rawText.findIndex((line) => line.match(/^SERVICE FROM (.*)$/g));
    let fullNameLine;
    let first_name;
    let last_name;
    if (serviceFromLineIndex >= 0) {
      fullNameLine = rawText[serviceFromLineIndex + 1];
      // first name & last name (dropping anything between first and last words)
      first_name = fullNameLine.split(' ').slice(0, 1).join(' ');
      last_name = fullNameLine.split(' ').slice(-1).join(' ');
    }

    // street address line 1 & 2
    const last5Lines = rawText.slice(-5);

    let street_address_line_1;
    let street_address_line_2;

    let cityStateZipCodeLine = [];
    // city, state, zip code
    const lineWithCityStateZipCodeIndex = last5Lines.findIndex((line) => line.match(/^([A-Za-z\s]+) ([A-Z]{2}) (\d+-\d+)$/g));
    if (lineWithCityStateZipCodeIndex) {
      street_address_line_1 = last5Lines[lineWithCityStateZipCodeIndex - 1];
      street_address_line_2 = '';
      cityStateZipCodeLine = last5Lines[lineWithCityStateZipCodeIndex].split(' ');
    }
    const [city, state, zip_code] = cityStateZipCodeLine;

    // bill amount
    let bill_amount = keyValues['PLEASE PAY'];
    if(!bill_amount || !bill_amount.length) {
      bill_amount = keyValues['This Month\'s Charges'];
    }

    // bill date
    const bill_date = rawText.slice(-15).find((line) => line.match(/^\w+ \d+, \d+$/g));

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
