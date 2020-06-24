/* eslint-disable camelcase */
const moment = require('moment');
const stringSimilarity = require('string-similarity');

module.exports = {

  name: 'Southwest Gas',

  matcher: (keyValues, rawText) => {
    const tests = [
      (rawText.find((line) => line.match(/^Southwest Gas Corporation(.*)$/g))),
      (rawText.find((line) => line.match(/swgas.com/g))),
      (rawText.find((line) => line.toUpperCase().match(/SOUTHWEST GAS/g))),
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
    const customer = keyValues[keys[stringSimilarity.findBestMatch(
      'Customer:',
      keys,
    ).bestMatchIndex]];

    let first_name;
    let last_name;
    if (customer) {
      // first name & last name (dropping anything between first and last words)
      first_name = customer.split(' or ')[0].split(' ').slice(0, 1).join(' ');
      last_name = customer.split(' or ')[0].split(' ').slice(1, 2).join(' ');
    }

    // street address line 1 & 2
    const lineWithCityStateZipCodeIndex = rawText.findIndex((line) => line.match(/^[A-Z\s]+ [A-Z]{2} \d+-?\d+$/g));
    let street_address_line_1 = keyValues['Service Address:'];

    if (!street_address_line_1 || !street_address_line_1.length) {
      street_address_line_1 = rawText[lineWithCityStateZipCodeIndex - 1];
    }

    const matchedZipCodeInAddress = /^(.*) (\d+-?\d+?)$/g.exec(street_address_line_1) || [];
    const [, cleanAddress] = matchedZipCodeInAddress;

    if (cleanAddress) {
      street_address_line_1 = cleanAddress;
    }

    const street_address_line_2 = '';

    // city, state, zip code
    const [city, state, zip_code] = customer.split(' ').slice(-3);

    // bill amount
    const bill_amount = keyValues[keys[stringSimilarity.findBestMatch(
      'Amount due:',
      keys,
    ).bestMatchIndex]];


    // bill date
    let bill_date = keyValues['DUE DATE'];
    if (!bill_date || !bill_date.length) {
      bill_date = rawText.find((line) => line.match(/Due on or before/)).replace('Due on or before: ', '');
    }

    // account number
    let account_number = keyValues['ACCOUNT NUMBER'];

    if (!account_number || !account_number.length) {
      account_number = rawText.filter((line) => (
        line.match(/ACCOUNT NUM/g)
        && line.match(/\d+/g)
      ));

      account_number = (/(.*) (\d+\-\d+\-\d+)/g.exec(account_number) || [])[2];
    }

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
