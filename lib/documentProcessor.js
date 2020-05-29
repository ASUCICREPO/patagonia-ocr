const ApiError = require('./ApiError');

const arizonaDriverLicense = require('./documentTypes/arizonaDriverLicense');
const apsBill = require('./documentTypes/apsBill');
const southwestGasBill = require('./documentTypes/southwestGasBill');
const cityOfPhoenixWaterBill = require('./documentTypes/cityOfPhoenixWaterBill');
const srpBill = require('./documentTypes/srpBill');

// document types available for processing
const documentTypes = [
  arizonaDriverLicense,
  apsBill,
  southwestGasBill,
  cityOfPhoenixWaterBill,
  srpBill
];

module.exports = (keyValues, rawText) => {
  const out = {
    found: false,
  };

  documentTypes.some((documentType) => {
    if (documentType.matcher(keyValues, rawText)) {
      out.found = true;
      out.documentType = documentType.name;
      out.keyValues = documentType.extractor(keyValues, rawText);
      return true;
    }
  });

  if (!out.found) {
    console.log('Not found', keyValues, rawText);
    throw new ApiError('Not Implemented', 501);
  }

  return out;
};
