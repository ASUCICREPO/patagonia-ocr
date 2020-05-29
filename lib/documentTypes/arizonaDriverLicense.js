/* eslint-disable camelcase */
module.exports = {

  name: 'AZDL',

  matcher: (keyValues, rawText) => {
    const tests = [
      (rawText.find((line) => line === 'Arizona')),
      (rawText.find((line) => line === 'DRIVER LICENSE')),
      (rawText.find((line) => line === 'USA')),
      (rawText.find((line) => /\d+ CLASS/g.test(line))),
      (rawText.find((line) => /\d+ DOB \d+\/\d+\/\d+/g.test(line))),
      (rawText.find((line) => /\d+ SEX (M|F)/g.test(line))),
    ];

    return tests.filter((t) => !t).length === 0;
  },

  extractor: (keyValues, rawText) => {
    // first name
    const first_name = rawText.find((line) => line.match(/^1[A-Za-z\s]+$/g)).replace('1 ', '');

    // last name
    const last_name = rawText.find((line) => line.match(/^2[A-Za-z\s]+$/g)).replace('2 ', '');

    // street address line 1 & 2
    const indexOfPreviousLine = rawText.findIndex((line) => line === '8');
    const street_address_line_1 = rawText[indexOfPreviousLine + 1];
    let street_address_line_2 = rawText[indexOfPreviousLine + 2];

    // city, state, zip code
    const lineWithCityStateZip = rawText.find((line) => line.match(/^[A-Za-z\s]+, [A-Z]{2} \d+$/g));
    const matchedCityStateZip = /^([A-Za-z\s]+), ([A-Z]{2}) (\d+)$/g.exec(lineWithCityStateZip);
    const [, city, state, zip_code] = matchedCityStateZip;

    if(lineWithCityStateZip === street_address_line_2) {
      street_address_line_2 = '';
    }

    return {
      type: 'AZDL',
      first_name,
      last_name,
      street_address_line_1,
      street_address_line_2,
      city,
      state,
      zip_code,
    };
  },
};
