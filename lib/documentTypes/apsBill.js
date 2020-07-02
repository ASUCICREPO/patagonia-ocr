/* eslint-disable camelcase */
const moment = require('moment');
const stringSimilarity = require('string-similarity');

module.exports = {

  name: 'APS',

  matcher: (keyValues, rawText) => {
    const tests = [
      (rawText.find((line) => line === 'aps')),
      (rawText.find((line) => line.match(/Your electricity bil/))),
      (rawText.find((line) => line.match(/aps.com/))),
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
    const lineWithCityStateZipCodeIndex = rawText
      .findIndex((line) => line.match(/^[A-z\s]+\.?,? [A-Z]{2} \d+?-?\d+$/g));
    const lineWithCityStateZip = rawText[lineWithCityStateZipCodeIndex];
    let fullName;

    const first3Lines = rawText.slice(0, 3);
    fullName = first3Lines.find((line) => (
      line !== 'aps'
      && !line.match(/Your electricity bill?/gi)
      && !line.match(/Bill? date/gi)
      && !line.match(/\d+/g)
    ));

    if (!fullName) {
      fullName = rawText.slice(lineWithCityStateZipCodeIndex - 5, lineWithCityStateZipCodeIndex + 5)
        .filter((line) => (
          line.indexOf(' ') >= 0
          && line.toUpperCase() === line
          && !line.match(/Total amount paid/gi)
          && !line.match(/News from APS/gi)
          && !line.match(/Things you need to know/gi)
          && !line.match(/Visit aps/gi)
          && !line.match(/Pay 24 hours/gi)
          && !line.match(/Download our free/gi)
        )).find((line) => !line.match(/\d+/g));
    }

    let first_name;
    let last_name;
    if (fullName) {
      // first name & last name (dropping anything between first and last words)
      first_name = fullName.split(' ').slice(0, 1).join(' ');
      last_name = fullName.split(' ').slice(-1).join(' ');
    }


    // street address line 1 & 2
    const addressLines = rawText
      .slice(lineWithCityStateZipCodeIndex - 5, lineWithCityStateZipCodeIndex + 5)
      .filter((line) => (
        line.indexOf(' ') >= 0
        && line.match(/\d+/g)
        && !line.match(/Total amount paid/gi)
        && !line.match(/News from APS/gi)
        && !line.match(/Things you need to know/gi)
        && !line.match(/Visit aps/gi)
        && !line.match(/Pay 24 hours/gi)
        && !line.match(/Download our free/gi)
        && !line.match(/Call 602/gi)
        && line !== lineWithCityStateZip
      ));
    const [street_address_line_1, street_address_line_2] = addressLines;

    // city, state, zip code
    const matchedCityStateZip = /^([A-z\s]+)\.?,? ([A-Z]{2}) (\d+?-?\d+)$/g.exec(lineWithCityStateZip) || [];
    const [, city, state, zip_code] = matchedCityStateZip;

    // bill amount
    let bill_amount = keyValues[keys[stringSimilarity.findBestMatch(
      'Total amount due',
      keys,
    ).bestMatchIndex]];
    if (!bill_amount || !bill_amount.length) {
      bill_amount = keyValues[keys[stringSimilarity.findBestMatch(
        'Total amount due:',
        keys,
      ).bestMatchIndex]];
    }

    // bill date
    let bill_date = keyValues[keys[stringSimilarity.findBestMatch(
      'Payment due date',
      keys,
    ).bestMatchIndex]];
    if (!bill_date || !bill_date.length) {
      bill_date = keyValues[keys[stringSimilarity.findBestMatch(
        'Payment due date:',
        keys,
      ).bestMatchIndex]];
    }

    // account number
    let account_number;
    if (Object.hasOwnProperty.call(keyValues, 'Your account number')) {
      account_number = keyValues['Your account number'];
    }
    if (!account_number && Object.hasOwnProperty.call(keyValues, 'YOUR ACCOUNT NUMBER:')) {
      account_number = keyValues['YOUR ACCOUNT NUMBER:'];
    }
    if (!account_number || !account_number.length) {
      const accountNumberIndex = rawText.findIndex((line) => line === 'Your account number');
      account_number = rawText.slice(accountNumberIndex, accountNumberIndex + 7).find((line) => line.match(/^\d+$/g));
    }
    if (!account_number || !account_number.match(/^\d+$/g)) {
      account_number = '';
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
