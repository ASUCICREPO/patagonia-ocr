const apsBill = require('./billTypes/aps');

// bill types available for processing
const billTypes = [apsBill];

/*
 * ProcessBill function
 * @param {*} keyValues
 * @param {*} rawText
 */

module.exports = (keyValues, rawText) => {
  const out = {
    found: false,
    keyValues,
    rawText,
  };

  billTypes.forEach((billType) => {
    if (billType.matcher(keyValues, rawText)) {
      out.found = true;
      out.billType = billType.name;
      out.keyValues = billType.extractor(keyValues, rawText);
    }
  });

  return out;
};
