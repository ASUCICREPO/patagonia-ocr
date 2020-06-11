# Extraction Logic

This is a guide on how where the keys mapped from the Textract output.

The logic for each `documentType` mostly uses key-value pairs when available, and
then some fixed 'anchor' points and regex.

## AZDL

Identified by finding lines containing 'Arizona', 'DRIVER LICENSE', 'USA', 'CLASS',
'DOB'.

- `first_name` is found in the line starting with a '1'.

- `last_name` is found in the line starting with a '2'.

- `street_address_line_1`, `street_address_line_2` are found in the line starting
with an '8'.

- `city`, `state` and `zip_code` from the line matching this regex
`/^[A-Za-z\s]+, [A-Z]{2} \d+$/g`.


## APS

Identified by finding 'aps', 'Your electricity bill', 'News from APS'.

- `first_name`, `last_name` are found from below the 'Your electricity bill' line
at the top.

- `street_address_line_1`, `street_address_line_2` are found in the bottom of the
first page of the bill, just below where the full name in uppercase is found.

- `city`, `state`, `zip_code` line are found matching the line with this regex
`/^[A-Z\s]+ [A-Z]{2} \d+-\d+$/g`

- `bill_amount` is found under the key 'Total amount due:'.

- `bill_date` is found in the 'Bill date:' line at the top of the first page.

- `account_number` from 'Your account number' line at the right of the first page.


## Southwest Gas

Identified by finding 'Southwest Gas Corporation', 'www.swgas.com',
'SOUTHWEST GAS CORPORATION'.

- `first_name`, `last_name` are found from the 'Customer:' key.

- `street_address_line_1` extracted from 'Service Address:' key.

- `street_address_line_2` is always empty.

- `city`, `state`, `zip_code` are found from the same 'Customer:' key.

- `bill_amount` is found in the key 'Amount due:'.

- `bill_date` if found in the key 'DATE MAILED'.

- `account number` is found under the key 'ACCOUNT NUMBER'.


## City of Phoenix Water

Identified by finding 'City of Phoenix', 'Phoenix.gov', 'Water Base Fee',
'Your Monthly Water Usage (gallons)'.

- `first_name`, `last_name` are always found in the second line.

- `street_address_line_1`, `city`, `state`, `zip_code` are extracted from
'Service Address:' line.

- `street_address_line_2` is always empty.

- `bill_amount` is found in the key 'Total Amount Due'.

- `bill_date` if found in the key 'Bill Date:'.

- `account number` is found under the key 'Account Number:'.

## SRP

Identified by finding 'srpnet.com', 'Energy Charge', 'Phoenix City Tax', 'kWh'.

- `first_name`, `last_name` are anchored from the 'SERVICE FROM ...' line at the
top of the bill.

-  `street_address_line_1`, `city`,  `state`, `zip_code` are anchored form the last
5 lines at the bottom of the bill where the full name is found.

- `street_address_line_2` is always empty.

- `bill_amount` is found under the key 'This Month's Charges' on the
right-hand side of the bill.

- `bill_date` is found on the line containing 'YOUR ACCOUNT SUMMARY AS OF ' just above.

- `account_number` is found in the 'Account # ' line at the top-right corner.

[< back to main docs](./README.md)
