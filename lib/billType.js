const tepBill = {
  name: 'TEP energy bill',
  matcher: (keyValues, rawText) => {
    // We check for certaing strings in rawText
    return true;
  },
  extractor: (keyValues, rawText) => {
    // We try to recover street, and other values.
    return keyValues;
  },
};

const billTypes = [tepBill];

module.exports = billTypes;
