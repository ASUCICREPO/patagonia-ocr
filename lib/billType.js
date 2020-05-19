const tepBill = {
  name: 'TEP energy bill',
  matcher: (keyValues, rawText) => {
    return true;
  },
  extractor: (keyValues, rawText) => {
    return keyValues;
  },
};

const billTypes = [tepBill];

module.exports = billTypes;
