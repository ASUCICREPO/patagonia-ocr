/* eslint-disable camelcase */
module.exports = {

  name: 'Arizona\'s Driver License',

  matcher: (keyValues, rawText) => {
    const tests = [
      (rawText.find((line) => line === 'Arizona')),
      (rawText.find((line) => line === 'DRIVER LICENSE')),
      (rawText.find((line) => line === 'USA')),
      (rawText.find((line) => /\d+ CLASS/g.test(line))),
      (rawText.find((line) => /\d+ DOB \d+\/\d+\/\d+/g.test(line))),
    ];

    return tests.filter((t) => !t).length <= 2;
  },

  extractor: (keyValues, rawText) => {
    // first name
    let first_name = rawText.find((line) => line.match(/^1 (.*)$/g));
    if (first_name && first_name.substr(0, 2) === '1 ') {
      first_name = first_name.replace('1 ', '');
    }

    // last name
    let last_name = rawText.find((line) => line.match(/^2 (.*)$/g));
    if (last_name && last_name.substr(0, 2) === '2 ') {
      last_name = last_name.replace('2 ', '');
    }

    // street address line 1 & 2
    const streetAddressLineIndex = rawText.findIndex((line) => line.match(/^8(.*)$/g));
    let street_address_line_1 = rawText[streetAddressLineIndex];
    let street_address_line_2 = rawText[streetAddressLineIndex + 1];

    if (street_address_line_1 && street_address_line_1.substr(0, 2) === '8 ') {
      street_address_line_1 = street_address_line_1.replace('8 ', '');
    }

    if (street_address_line_1 === '8') {
      street_address_line_1 = undefined;
    }

    // city, state, zip code
    const lineWithCityStateZipIndex = rawText.findIndex((line) => line.match(/^([A-Za-z\s]+, )?[A-Z]{2} \d+$/g));
    const lineWithCityStateZip = rawText[lineWithCityStateZipIndex];

    if (!street_address_line_1 && lineWithCityStateZipIndex > 0) {
      street_address_line_1 = rawText[lineWithCityStateZipIndex - 1];
    }
    if (lineWithCityStateZip === street_address_line_2
      || street_address_line_1 === street_address_line_2) {
      // case of no street_address_line_2
      street_address_line_2 = '';
    }

    const matchedCityStateZip = /^([A-Za-z\s]+, )?([A-Z]{2}) (\d+)$/g.exec(lineWithCityStateZip) || [];
    let [, city] = matchedCityStateZip;
    const [, , state, zip_code] = matchedCityStateZip;
    if (city) {
      city = city.replace(', ', '');
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
    };
  },
};
