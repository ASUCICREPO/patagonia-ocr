/* eslint-disable camelcase */
const moment = require('moment');
const stringSimilarity = require('string-similarity');

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
    const keys = Object.keys(keyValues);
    const serviceFromLineIndex = rawText.findIndex((line) => line.match(/^SERVICE FROM (.*)$/g));
    let fullNameLine;
    let first_name;
    let last_name;
    if (serviceFromLineIndex >= 0) {
      fullNameLine = rawText[serviceFromLineIndex + 1];
      if (!fullNameLine.match(/^YOUR ACCOUNT SUMMARY(.*)$/g)) {
        // first name & last name (dropping anything between first and last words)
        first_name = fullNameLine.split(' ').slice(0, 1).join(' ');
        last_name = fullNameLine.split(' ').slice(-1).join(' ');
      }
    }

    let last10Lines = rawText.slice(-10);
    if (last10Lines.filter((line) => line === 'PRESCOTT AZ 86304-8062').length === 1) {
      // remove SRP address
      last10Lines = last10Lines.filter((line) => (
        line !== 'PO BOX 80062'
        && line !== 'PRESCOTT AZ 86304-8062'
      ));
    }
    // street address line 1 & 2
    let street_address_line_1;
    let street_address_line_2;

    let cityStateZipCodeLine = [];
    // city, state, zip code
    const lineWithCityStateZipCodeIndex = last10Lines.findIndex((line) => line.match(/^([A-Za-z\s]+) ([A-Z]{2}) (\d+-\d+)$/g));
    if (lineWithCityStateZipCodeIndex) {
      if (!first_name || !last_name
        || !first_name.length || !last_name.length
        || first_name.match(/\d+/g) || last_name.match(/\d+/g)) {
        fullNameLine = last10Lines[lineWithCityStateZipCodeIndex - 2];
        first_name = fullNameLine.split(' ').slice(0, 1).join(' ');
        last_name = fullNameLine.split(' ').slice(-1).join(' ');
      }
      street_address_line_1 = last10Lines[lineWithCityStateZipCodeIndex - 1];
      street_address_line_2 = '';
      cityStateZipCodeLine = last10Lines[lineWithCityStateZipCodeIndex].split(' ');
    }
    const [city, state, zip_code] = cityStateZipCodeLine;

    // bill amount
    let bill_amount = keyValues['PLEASE PAY'];
    if (!bill_amount || !bill_amount.length) {
      bill_amount = keyValues['This Month\'s Charges'];
    }

    // bill date
    let bill_date = keyValues[keys[stringSimilarity.findBestMatch(
      'Please Pay by',
      keys,
    ).bestMatchIndex]];

    if (!bill_date || !bill_date.length || !bill_date.match(/^\w+ \d+, \d+$/g)) {
      bill_date = rawText.slice(-20).find((line) => line.match(/^\w+ \d+, \d+$/g));
    }

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
