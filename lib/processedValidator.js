module.exports = (processed) => {
  const validated = {};
  const { type } = processed;
  const errors = [];
  const requiredFields = [
    'type',
    'first_name',
    'last_name',
    'street_address_line_1',
    'street_address_line_2',
    'city',
    'state',
    'zip_code',
  ];

  if (type !== 'AZDL') {
    // bills require these too
    requiredFields.push('bill_amount', 'bill_date', 'account_number');
  }

  requiredFields.forEach((field) => {
    if (Object.hasOwnProperty.call(processed, field)
      && processed[field]
      && processed[field].length) {
      // some data normalization could be applied
      validated[field] = processed[field];
    } else {
      errors.push(field);
      validated[field] = '';
    }
  });

  if (errors.length) {
    validated.errors = errors;
  }

  return validated;
};
