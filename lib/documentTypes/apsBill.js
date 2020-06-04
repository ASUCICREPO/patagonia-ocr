/* eslint-disable camelcase */
module.exports = {

  name: 'APS',

  matcher: (keyValues, rawText) => {
    const tests = [
      (rawText.find((line) => line === 'aps')),
      (rawText.find((line) => line === 'Your electricity bill')),
      (rawText.find((line) => line === 'News from APS')),
    ];

    return tests.filter((t) => !t).length === 0;
  },

  extractor: (keyValues, rawText) => {
    // first name & last name (WARNING splitting full name by space potential inconsistency)
    const indexOfFullNameLine = rawText.findIndex((line) => line === 'Your electricity bill') + 1;
    const fullName = rawText[indexOfFullNameLine];
    const first_name = fullName.split(' ').slice(0, -1).join(' ');
    const last_name = fullName.split(' ').slice(-1).join(' ');

    // street address line 1 & 2
    const indexOfFullNameInCapsLine = rawText.findIndex((line) => line === fullName.toUpperCase());
    const street_address_line_1 = rawText[indexOfFullNameInCapsLine + 1];
    let street_address_line_2 = rawText[indexOfFullNameInCapsLine + 2];

    // city, state, zip code
    const lineWithCityStateZip = rawText.find((line) => line.match(/^[A-Z\s]+ [A-Z]{2} \d+-\d+$/g));
    const matchedCityStateZip = /^([A-Za-z\s]+) ([A-Z]{2}) (\d+-\d+)$/g.exec(lineWithCityStateZip) || [];
    const [, city, state, zip_code] = matchedCityStateZip;
    if (lineWithCityStateZip === street_address_line_2) {
      street_address_line_2 = '';
    }

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
