const ApiError = require('./ApiError');

const arizonaDriverLicense = require('./documentTypes/arizonaDriverLicense');
const apsBill = require('./documentTypes/apsBill');

// document types available for processing
const documentTypes = [arizonaDriverLicense, apsBill];

module.exports = (keyValues, rawText) => {
  const out = {
    found: false,
    keyValues,
    rawText,
  };

  documentTypes.forEach((documentType) => {
    if (documentType.matcher(keyValues, rawText)) {
      out.found = true;
      out.documentType = documentType.name;
      out.keyValues = documentType.extractor(keyValues, rawText);
    }
  });

  if (!out.found) {
    console.log('Not found', keyValues, rawText);
    throw new ApiError('Not Implemented', 501);
  }

  return out;
};
