/* eslint-disable camelcase */
module.exports = {

  name: 'SOUTHWESTGAS',

  matcher: (keyValues, rawText) => {
    const tests = [
      (rawText.find((line) => line.match(/^Southwest Gas Corporation(.*)$/g))),
      (rawText.find((line) => line === 'www.swgas.com')),
      (rawText.find((line) => line === 'SOUTHWEST GAS CORPORATION')),
    ];

    return tests.filter((t) => !t).length === 0;
  },

  extractor: (keyValues) => {
    // first name & last name (WARNING splitting full name by space potential inconsistency)
    const customer = keyValues['Customer:'];
    const first_name = customer.split(' or ')[0].split(' ').slice(0, -1).join(' ');
    const last_name = customer.split(' or ')[0].split(' ').slice(-1).join(' ');

    // street address line 1 & 2
    const street_address_line_1 = keyValues['Service Address:'];
    const street_address_line_2 = '';

    // city, state, zip code
    const [city, state, zip_code] = customer.split(' ').slice(-3);

    // bill amount
    const bill_amount = keyValues['Amount due:'];

    // bill date
    const bill_date = keyValues['DATE MAILED'];

    // account number
    const account_number = keyValues['ACCOUNT NUMBER'];

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
