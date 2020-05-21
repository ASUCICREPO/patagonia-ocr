ASU CIC Textract API
===

This repo uses Serverless framework for deployment of a Serverless service
into an AWS account.

Setup
---
`npm i`

`export AWS_PROFILE=asuCicProfile`

Test
---
- Lint code to check syntax and enforce style

`npm run lint`

- Locally run Jest tests

`npm run test`

Deployment
---
Deploy the Lambda function

`serverless deploy`


API DOCUMENTATION
===

This API has a single endpoint accepts a POST image or document which may be an
image (PNG / JPG) or a document (PDF). It runs it through Amazon Textract to identify
if it is a Driver's License, or a Utility Bill, then find any needed keys that Textract
missed, and return an output.

Responses and Errors
---

This is a sample response when POSTing a Driver's License image:

```
{
  "first_name": "John",
  "last_name": "Deacon",
  "street_address_line_1": "1801 W JEFFERSON ST",
  "street_address_line_2": "",
  "city": "Phoenix",
  "state": "AZ",
  "zip_code": "85001-3289",
}
```

This is a sample response when POSTing a Utility Bill document:

```
{
  "bill_type": "Southwest Gas",
  "first_name": "John",
  "last_name": "Deacon",
  "street_address_line_1": "1801 W JEFFERSON ST",
  "street_address_line_2": "",
  "city": "Phoenix",
  "state": "AZ",
  "zip_code": "85001-3289",
  "bill_amount": "$941.02",
  "bill_date": "5/21/2020",
  "account_number": "765412764921"
}
```
