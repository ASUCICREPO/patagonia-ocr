# ASU-CIC OCR API Documentation

This repository uses the _Serverless_ framework for deployment of a service
into an AWS account.

The API receives a single `file` in a `multipart/form-data` **POST** payload, validates
and converts it if necessary, uploads it to S3, calls the _AWS Textract_ service,
maps its output and parses it, saves it in an `.csv` file in an S3 bucket, and finally
responds to the HTTP request.

## Currently Supported files

File posted can be any `PNG / JPG / HEIC` image or a `PDF` document.

##### Utility Bills

- APS
- Southwest Gas
- APS
- City of Phoenix Water

##### Others
- Arizona Driver license

### Example Request `POST /ocr`
```
curl --location --request POST 'BASE_URL/ocr' \
--header 'x-api-key: apikey1' \
--form 'file=@/path/to/some/bill.pdf'
```
## Successful Responses

Response will have an HTTP status **200** _OK_ when successful.

Additionally there may be an `errors` array in the response body, with a list of `keys`
that could not be extracted from the uploaded `file`.

- Sample response when POST file is a Driver's License image:

```
    {
      "type": "AZDL",
      "first_name": "John",
      "last_name": "Deacon",
      "street_address_line_1": "",
      "street_address_line_2": "",
      "city": "Phoenix",
      "state": "AZ",
      "zip_code": "85001-3289",
      "errors": [
        "street_address_line_1",
        "street_address_line_2"
      ]
    }
```

- Sample response when POST file is an APS Bill document:

```
    {
      "type": "APS",
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

## Error Responses

Response will have an HTTP status of **4xx** or **5xx** when an error was encountered.

- **400** _Bad Request_

  No `file` was provided in the POST payload.


- **401** _Unauthorized_

  No valid `x-api-key` header was provided in the POST request.


- **413** _Payload Too Large_

  Provided `file` was found to be over the size limit.


- **415** _Unsupported Media Type_

  Provided `file` was found to be of an invalid type.


- **422** _Unprocessable Entity_

  Provided `file` could not be processed by _AWS Textract_.



- **501** _Not Implemented_

  Provided `file` could not be identified as a known document.


- **504** _Gateway Timeout_

  OCR process timeout.


- **500** _Internal Server Error_

  Unknown or unexpected error. (Further details in logs.)

---

# Development

### Setup

Install Serverless Framework `npm i -g serverless`

Install other development dependencies `npm i`

Configure your AWS credentials `export AWS_PROFILE=asuCicProfile`

### Development & Testing

Lint code to check syntax and enforce style `npm run lint`

Locally run Jest tests `npm run test`

### Deployment

Deploy the Lambda function `serverless deploy`


