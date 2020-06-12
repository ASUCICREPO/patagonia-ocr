/* eslint-disable camelcase */
const moment = require('moment');

module.exports = {

  name: 'APS',

  matcher: (keyValues, rawText) => {
    const tests = [
      (rawText.find((line) => line === 'aps')),
      (rawText.find((line) => line === 'Your electricity bill')),
      (rawText.find((line) => line === 'News from APS')),
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
    const indexOfFullNameLine = rawText.findIndex((line) => line === 'Your electricity bill') + 1;
    let fullName;
    let first_name;
    let last_name;
    if (indexOfFullNameLine >= 0) {
      fullName = rawText[indexOfFullNameLine];
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
    }

    // city, state, zip code
    const lineWithCityStateZip = rawText.find((line) => line.match(/^[A-Z\s]+ [A-Z]{2} \d+-\d+$/g));
    const matchedCityStateZip = /^([A-Za-z\s]+) ([A-Z]{2}) (\d+-\d+)$/g.exec(lineWithCityStateZip) || [];
    const [, city, state, zip_code] = matchedCityStateZip;

    // bill amount
    const bill_amount = keyValues['Total amount due:'];

    // bill date
    const lineWithBillDate = rawText.find((line) => line.match(/^Bill date: [A-Za-z]{3} \d+, \d+$/g));
    const matchedBillDate = /^Bill date: ([A-Za-z]{3} \d+, \d+)$/g.exec(lineWithBillDate) || [];
    const [, bill_date] = matchedBillDate;

    // account number
    const account_number = keyValues['Your account number'];

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
