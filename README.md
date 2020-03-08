# Ausgaben AWS Backend

[![Build Status](https://travis-ci.org/ausgaben/aws-backend.svg?branch=saga)](https://travis-ci.org/ausgaben/aws-backend) 

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
