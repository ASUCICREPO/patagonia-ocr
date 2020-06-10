# ASU-CIC OCR API Documentation

This repository uses the _Serverless_ framework for deployment of a service
into an AWS account.

The API receives a single `file` in a `multipart/form-data` **POST** payload, validates it,
converts it if necessary, and uploads it to S3.

When the provided file is a document (`PDF`) a call is made to the _AWS Textract_ and the
HTTP request is responded immediately with a `requestId` (later, a **GET** request can be made
to the same endpoint to retrieve the result data after the async process is finished).

The process continues asynchronously, when the _AWS Textract_ job is complete, the extracted
data is mapped and parsed, saved in a `.csv` file in an S3 bucket.

On the other side, when the provided file is an image (`PNG / JPG / HEIC`) the process is carried on synchronously,
the result data will be available in the response.

## Currently Supported files

File posted can be any `PNG / JPG / HEIC` image or a `PDF` document.

##### Utility Bills

- APS
- Southwest Gas
- APS
- City of Phoenix Water

##### Others
- Arizona Driver license


## Request `POST /ocr`
```
# Post a file to the service.
curl --location --request POST 'BASE_URL/ocr' \
--header 'x-api-key: apikey1' \
--form 'file=@/path/to/some/bill.png'
```

## Successful Responses

Response will have an HTTP status **200** _OK_ when successful.

When file is a PDF the response contains a `requestId` for the client application to
later try and retrieve

Additionally there may be an `errors` array in the response body, with a list of `keys`
that could not be extracted from the uploaded file.

- Sample response when file is a Driver's License PNG image:

```
    {
      "type": "AZDL",
      "first_name": "John",
      "last_name": "Deacon",
      "street_address_line_1": "921 E Main St",
      "street_address_line_2": "",
      "city": "Phoenix",
      "state": "AZ",
      "zip_code": "85001-3289",
      "errors": [
        "street_address_line_2"
      ]
    }
```

- Sample response when file is a PDF document:

```
    {
      "requestId": "1591708879608_rbloj8kb7ydbsp"
    }
```

## Request `GET /ocr/{requestId}`
```
# Get results from a processed PDF file.
curl --location --request GET 'BASE_URL/ocr/1591708879608_rbloj8kb7ydbsp' \
--header 'x-api-key: apikey1' \
```

- Sample response when source file was a PDF document and the process was successful:
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

  Provided `file` was found to be of an invalid or unsupported type.


- **422** _Unprocessable Entity_

  Provided `file` could not be processed by _AWS Textract_.

- **501** _Not Implemented_

  Provided `file` could not be identified as a known document.

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


