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
    const lineWithCityStateZipCodeIndex = rawText.findIndex((line) => line.match(/^[A-Z\s]+ [A-Z]{2} \d+-\d+$/g));
    let fullName;
    console.log('aps lineWithCityStateZipCodeIndex', lineWithCityStateZipCodeIndex);
    const first3Lines = rawText.slice(0, 3);
    fullName = first3Lines.find((line) => (
      line !== 'aps'
      && line !== 'Your electricity bill'
      && !line.match(/Bill? date/gi)
      && !line.match(/\d+/g)
    ));
    console.log('aps fullName', fullName);
    if (!fullName) {
      const last7Lines = rawText.slice(-7);
      fullName = last7Lines.find((line) => (
        !line.match(/\d+/g)
        && line === line.toUpperCase()
        && line.length >= 6
      ));
      console.log('aps last7Lines', last7Lines);
      console.log('aps fullName1', fullName);
    }
    if (!fullName) {
      fullName = rawText.slice(lineWithCityStateZipCodeIndex - 5, 10).find((line) => (
        line === line.toUpperCase()
        && line.indexOf(' ') >= 0
      ));
      console.log('aps fullName2', fullName);
    }

    console.log('aps fullName', fullName);
    let first_name;
    let last_name;
    let street_address_line_1;
    let street_address_line_2;
    if (fullName) {
      // first name & last name (dropping anything between first and last words)
      first_name = fullName.split(' ').slice(0, 1).join(' ');
      last_name = fullName.split(' ').slice(-1).join(' ');

      // street address line 1 & 2
      const indexOfFullNameInCapsLine = stringSimilarity.findBestMatch(
        fullName.toUpperCase(),
        rawText,
      ).bestMatchIndex;

      if (indexOfFullNameInCapsLine >= 0) {
        street_address_line_1 = rawText[indexOfFullNameInCapsLine + 1];
        street_address_line_2 = rawText[indexOfFullNameInCapsLine + 2];
      } else {
        street_address_line_1 = rawText[lineWithCityStateZipCodeIndex - 1];
      }

      if (street_address_line_2.match(/Visit aps.com/gi)) {
        // case of no street_address_line_2
        street_address_line_2 = '';
      }
    }

    // city, state, zip code
    const lineWithCityStateZip = rawText[lineWithCityStateZipCodeIndex];
    if (lineWithCityStateZip === street_address_line_2) {
      // case of no street_address_line_2
      street_address_line_2 = '';
    }
    const matchedCityStateZip = /^([A-Za-z\s]+) ([A-Z]{2}) (\d+-\d+)$/g.exec(lineWithCityStateZip) || [];
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
    if (Object.hasOwnProperty.call(keyValues, 'YOUR ACCOUNT NUMBER:')) {
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
