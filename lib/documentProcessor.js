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
  srpBill,
];

module.exports = (keyValues, rawText) => {
  const out = {
    found: false,
  };

  documentTypes.some((documentType) => {
    if (documentType.matcher(keyValues, rawText)) {
      out.found = true;
      out.documentType = documentType.name;
      out.extracted = documentType.extractor(keyValues, rawText);
      out.normalizer = documentType.normalizer;
      return true;
    }
    return false;
  });

  if (!out.found) {
    console.log('Not implemented', keyValues, rawText);
    throw new ApiError(
      `Failed to read document. Document may be an unsupported type or
      item may not be legible. The system accepts APS, Southwest Gas,
      SRP and City of Phoenix bills, as well as Arizona Driver’s
      Licenses in the following formats: JPEG, PNG, PDF, and HEIF
      (iPhone Format).`,
      501,
    );
  }

  return out;
};
