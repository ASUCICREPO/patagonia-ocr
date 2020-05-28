module.exports = {

  name: 'aps energy bill',

  matcher: (keyValues, rawText) => {
    console.log(rawText);
    const tests = [
      (rawText.find((line) => line === 'aps')),
      (rawText.find((line) => line === 'Your electricity bill')),
    ];

    return tests.filter((t) => !t).length === 0;
  },

  extractor: (keyValues, rawText) => {
    const normalized = {};

    // account number
    normalized.bill_type = 'APS';
    normalized.full_name = rawText[2];
    normalized.address = rawText[8];
    normalized.account_number = keyValues['Your account number'];

console.log(normalized);
    return normalized;
  },

};
