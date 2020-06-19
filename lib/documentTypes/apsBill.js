/* eslint-disable camelcase */
const moment = require('moment');

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
    // first name & last name (WARNING splitting full name by space potential inconsistency)
    const first3Lines = rawText.slice(0, 3);
    let fullName = first3Lines.find((line) => (
      line !== 'aps'
      && line !== 'Your electricity bill'
      && !line.match(/Bill? date/gi)
      && !line.match(/\d+/g)
    ));
    if (!fullName) {
      const last7Lines = rawText.slice(-7);
      fullName = last7Lines.filter((line) => (
        !line.match(/\d+/g)
        && line === line.toUpperCase()
        && line.length >= 6
      ));
    }
    let first_name;
    let last_name;
    if (fullName) {
      first_name = fullName.split(' ').slice(0, -1).join(' ');
      last_name = fullName.split(' ').slice(-1).join(' ');
    }

    // street address line 1 & 2
    const indexOfFullNameInCapsLine = rawText.findIndex((line) => line === fullName.toUpperCase());
    let street_address_line_1;
    let street_address_line_2;
    if (indexOfFullNameInCapsLine >= 0) {
      street_address_line_1 = rawText[indexOfFullNameInCapsLine + 1];
      street_address_line_2 = rawText[indexOfFullNameInCapsLine + 2];

      if (street_address_line_2.match(/Visit aps.com/g)) {
        // case of no street_address_line_2
        street_address_line_2 = '';
      }
    }

    // city, state, zip code
    const lineWithCityStateZip = rawText.find((line) => line.match(/^[A-Z\s]+ [A-Z]{2} \d+-\d+$/g));
    if (lineWithCityStateZip === street_address_line_2) {
      // case of no street_address_line_2
      street_address_line_2 = '';
    }
    const matchedCityStateZip = /^([A-Za-z\s]+) ([A-Z]{2}) (\d+-\d+)$/g.exec(lineWithCityStateZip) || [];
    const [, city, state, zip_code] = matchedCityStateZip;

    // bill amount
    const bill_amount = keyValues['Total amount due:'];

    // bill date
    const bill_date = keyValues['Payment due date:'];

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
