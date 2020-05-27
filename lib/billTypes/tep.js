module.exports = {

  name: 'TEP energy bill',

  matcher: (keyValues, rawText) => {
    if(!keyValues || !rawText) {
      return false;
    }

    const tests = [
      (rawText.includes('TEP')),
      (rawText.includes('Tucson Electric Power')),
      (rawText.includes('Your TEP Energy Bill')),
      (rawText.includes('TUCSON ELECTRIC POWER COMPANY')),
      (rawText.includes('PO BOX 80077')),
    ];

    return tests.filter((t) => !t).length === 0;
  },

  extractor: (keyValues, rawText) => {
    // output
    const normalized = {
      type: 'TEP',
    };

    const string = rawText.toString('utf-8');
    const array = string.split(/\r?\n/);

    // service number (used for finding address too)
    const serviceNumber = /(Service No\.) (\d+)/gm.exec(string);

    normalized.service_number = serviceNumber[2].trim();

    // account number
    normalized.account_number = [...new Set(keyValues.filter((kv) => kv.key.match(/Account/g) && kv.value.match(/\d+/g)))][0].value.trim();

    // full address found in line before service number
    const regex = `Service No. ${normalized.service_number}*`;
    normalized.address = array[array.findIndex((line) => !!line.match(regex)) - 1];

    // bill amount (used for finding name too)
    normalized.bill_amount = keyValues.filter((kv) => kv.key.match(/Total Amount Due/g) && kv.value.match(/\$\d+/g))[0].value.trim();

    // bill date
    normalized.bill_date = keyValues.filter((kv) => kv.key.match(/Bill date/g) && kv.value.match(/\$\d+/g))[0].value.trim();

    // name
    console.log(normalized);
    return normalized;
  },

};
