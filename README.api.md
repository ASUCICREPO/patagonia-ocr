# API Documentation

## Important Notes

- **!** All data on examples and versioned in the repository for tests has been
redacted for privacy.

- Data extracted is normalized to all upper-case on strings, bill dates are
formatted to 'MM-DD-YYYY', and currency indicators are removed from bill amounts.

- This API is intended to be private, you need to provide an `x-api-key` header which
should match one of a comma-separated list provided as an environment variable when
deploying.

## Request `POST /ocr`

Post a file to the service. Responds with a simple `requestId` for PDFs, or with
result in the form of `JSON`.

## Request `GET /ocr/{requestId}`

Retrieves the extracted data if available for a given `requestId`.

## Succesful Responses

Response will have an HTTP status of **200 OK** when process was successful and
**202 Accepted** when process is pending.

Additionally, an `Errors` key may be present, with a list of keys that could not
be extracted from the provided file, and a `Status` key which should be useful to
trigger a retry mechanism on the **GET** (value can be `SUCCEEDED`, `PENDING`,
`FAILED` for an existing `requestId`, or `NOT_FOUND` otherwise).


## Error Responses

Response will have an HTTP status of **4xx** or **5xx** when an error was encountered.

- **400** _Bad Request_

  No `file` was provided in the POST payload.


- **401** _Unauthorized_

  No valid `x-api-key` header was provided in the POST request.


- **404** _Unauthorized_

  No valid `requestId` was provided in the first path parameter of the GET request.


- **413** _Payload Too Large_

  Provided `file` was found to be over the size limit.


- **415** _Unsupported Media Type_

  Provided `file` was found to be of an invalid or unsupported type.


- **422** _Unprocessable Entity_

  Provided `file` could not be processed by _AWS Textract_.


- **501** _Not Implemented_

  Provided `file` could not be identified as a known document.


- **500** _Internal Server Error_

  Unknown or unexpected error. (Further details should be available in the environment logs.)

## Examples

  Here's some example requests with their response.


- PNG Driver's License:

```
    # request
    curl --location --request POST 'https://7v3z191yf7.execute-api.us-east-2.amazonaws.com/ocr' \
    --header 'x-api-key: apikey1' \
    --form 'file=@/path/to/some/arizona_driver_license.png'

    # response
    {
      "Type": "AZDL",
      "First Name": "JOHN",
      "Last Name": "DOE",
      "Street Address Line 1": "921 E MAIN ST",
      "Street Address Line 2": "",
      "City": "PHOENIX",
      "State": "AZ",
      "Zip Code": "85001-3289",
      "RequestId": "1591890983882_dwu8kbaysgcr",
      "Status": "SUCCEEDED"
    }
```

- PDF bill:

```
    # request
    curl --location --request POST 'https://7v3z191yf7.execute-api.us-east-2.amazonaws.com/ocr' \
    --header 'x-api-key: apikey1' \
    --form 'file=@/path/to/some/bill.pdf'

    # response
    {
      "RequestId": "1591708879608_rbloj8kb7ydbsp"
    }
```

- PDF bill data retrieval

```
    # request
    curl --location --request GET 'https://7v3z191yf7.execute-api.us-east-2.amazonaws.com/ocr/1591708879608_rbloj8kb7ydbsp'

    # response
    {
      "Type": "APS",
      "First Name": "FREDDY",
      "Last Name": "DEACON",
      "Street Address Line 1": "1801 W JEFFERSON ST",
      "Street Address Line 2": "",
      "City": "PHOENIX",
      "State": "AZ",
      "Zip Code": "85001-3289",
      "bill_amount": "941.02",
      "bill_date": "5/21/2020",
      "account_number": "765412764921",
      "errors": "Street Address Line 2",
      "Status": "SUCCEEDED"
    }
```

[< back to main docs](./README.md)
