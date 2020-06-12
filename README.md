# ASU-CIC OCR API

## Description
The API receives a single file in the `file` key of a _multipart/form-data_
**POST** payload, validates it, converts it if necessary, and uploads it to S3.

When the provided file is a _PDF document_ a call is made to AWS Textract and
the HTTP request is responded immediately with a `requestId`, the process
continues asynchronously via an SNS topic, when the AWS Textract job is complete,
the obtained data is mapped, validated, normalized, and then saved in a `.csv`
file in an S3 bucket. Later a **GET** request can be made to the same endpoint
appending the `/requestId` to the url, to retrieve the result data when the
process is finished.

On the other side, when the provided file is an _image_ the process is carried on
synchronously, and the result data will be available in the same **POST** response.


## Currently Supported `file` types

File posted can be any `PNG / JPG / HEIC` image or a `PDF` document. Maximum file
size is `6MB`.

## Currently Supported `documentTypes`

##### Utility Bills

- APS
- Southwest Gas
- City of Phoenix Water
- SRP

##### Others
- Arizona Driver license

## Important Notes
1- Objects stored in the S3 bucket have a lifecycle of 14 days before deletion.

2- You can add `?debug` to any **POST** or **GET** request made to view more
details on output and logs. Also all intermediate states of the data is saved
into the S3 bucket when this flag is present.

---

## API Documentation

See [README.api.md](./README.api.md) for full docs regarding the API.

## Data Extraction Logic Documentation

See [README.ext.md](./README.ext.md) for docs on currently supported
`documentTypes`

## Development Documentation

See [README.dev.md](./README.dev.md)

