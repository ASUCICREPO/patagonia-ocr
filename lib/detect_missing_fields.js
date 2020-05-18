'use strict';

module.exports = async (data) => {

  const requiredFields = [
    'account_number', 'address', 'service_number', 'bill_date', 'previous_amount', 'total_amount'
  ];

  console.log(data);
};

