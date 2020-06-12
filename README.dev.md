# Development

This repository uses the _Serverless_ framework for deployment of a service
into an AWS account.

## Important Notes

- **!** Please beware of never versioning or expose private information.

## Setup

Install Serverless Framework `npm i -g serverless`

Install other development dependencies `npm i`

Configure AWS credentials, for example: `export AWS_PROFILE=asuCicProfile`
Configure the AWS region, for example: `export REGION=us-east-1`
Configure the desired S3 bucket's name, for example: `export BUCKET=asu-cic-ocr-api-dev-documents`

## Development & Testing

Lint code to check syntax and enforce style `npm run lint`

Locally run Jest tests `npm run test`

## Deployment

Deploy the Lambda function `serverless deploy --stage dev`


[< back to main docs](./README.md)
