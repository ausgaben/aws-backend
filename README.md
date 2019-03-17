## Tests

    export STACK_NAME=${STACK_NAME:-ausgaben-dev}
    export AGGREGATES_EVENTS_TABLE=$(npx @nrfcloud/aws-cf-stack-output $STACK_NAME aggregateEventsTableName)
    npm test
