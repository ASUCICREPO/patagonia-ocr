const tepBill = require('./billTypes/tep');

// bill types available for processing
const billTypes = [tepBill];

/*
 * ProcessBill function
 * @param {*} keyValues
 * @param {*} rawText
 */

module.exports = (keyValues, rawText) => {
  const out = {
    found: false,
    type: '',
    keyValues,
    rawText,
  };

  billTypes.forEach((type) => {
    if (type.matcher(keyValues, rawText)) {
      out.found = true;
      out.billType = type.name;
      out.keyValues = type.extractor(keyValues, rawText);
    }
  });

  return out;
};
