# Ausgaben AWS Backend

5th iteration of the Ausgaben backend, built using AWS serverless components.

## Deploy

Make sure your have AWS credentials in your environment.

    npm ci
    npx tsc
    npx cdk deploy

## Tests

    export STACK_NAME=${STACK_NAME:-ausgaben-dev}
    export AGGREGATES_EVENTS_TABLE=$(npx @nrfcloud/aws-cf-stack-output $STACK_NAME aggregateEventsTableName)
    npm test
