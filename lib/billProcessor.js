const BillTypes = require('./billType');

/**
 * ProcessBill functions
 * @param {*} keyValues
 * @param {*} rawText
 */
module.exports = (keyValues, rawText) => {
  // For each bill type
  let found = false;
  let billType = '';
  for (let i = 0; i < BillTypes.length; i++) {
    const bType = BillTypes[i];
    // Check if content matches bill type
    if (bType.matcher(keyValues, rawText)) {
      // And extract values if so
      console.log('Parsing bill type:', bType.name);
      found = true;
      billType = bType.name;
      keyValues = bType.extractor(keyValues, rawText);
    }
  }
  return {
    found,
    keyValues,
    rawText,
    billType,
  };
};
