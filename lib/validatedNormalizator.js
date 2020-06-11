module.exports = (data, normalizer) => {
  const normalized = {};

  for (let [key, value] of Object.entries(data)) {
    let shouldAppend = true;

    switch(key) {
      case 'first_name':
      case 'last_name':
      case 'street_address_line_1':
      case 'street_address_line_2':
      case 'city':
      case 'state':
        value = value.toUpperCase();
        break;

      case 'bill_amount':
        value = value.replace(/\$/g, '');
        break;

      case 'bill_date':
        // date normalization is documentType-specific logic
        if(normalizer && normalizer.date) {
          value = normalizer.date(value);
        } else {
          console.log('Date Normalization not found', data.type, value);
        }
        break;

      default:
    }

    normalized[key] = value.trim();
  }

  return normalized;
};