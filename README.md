# Ausgaben AWS Backend

![Build](https://github.com/ausgaben/aws-backend/workflows/Tests/badge.svg)
[![Mergify Status](https://img.shields.io/endpoint.svg?url=https://dashboard.mergify.io/badges/ausgaben/aws-backend&style=flat)](https://mergify.io)
[![Known Vulnerabilities](https://snyk.io/test/github/ausgaben/aws-backend/badge.svg)](https://snyk.io/test/github/ausgaben/aws-backend)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

5th iteration of the Ausgaben backend, built using AWS serverless components.

## Deploy

Make sure your have AWS credentials in your environment.

    npm ci
    npx tsc

    # if this is the run the first time in an account
    npx cdk -a 'node dist/aws/cloudformation-sourcecode.js' deploy

    npx cdk deploy

## Tests

    export STACK_NAME=${STACK_NAME:-ausgaben-dev}
    export AGGREGATE_EVENTS_TABLE=$(npx @nrfcloud/aws-cf-stack-output $STACK_NAME aggregateEventsTableName)
    npm test
