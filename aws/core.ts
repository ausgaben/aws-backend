import { App, Output, Stack } from '@aws-cdk/cdk';
import { AggregateEventsTable } from './resources/aggregate-events-table';
import { Cognito } from './resources/cognito';

export class CoreStack extends Stack {
    public readonly aggregateEventsTable: AggregateEventsTable;
    public readonly cognito: Cognito;

    constructor(parent: App, id: string) {
        super(parent, id);

        this.aggregateEventsTable = new AggregateEventsTable(
            this,
            'aggregateEventsTable',
        );
        new Output(this, 'aggregateEventsTableName', {
            value: this.aggregateEventsTable.table.tableName,
            export: `${this.name}:aggregateEventsTableName`,
        });

        this.cognito = new Cognito(this, 'cognito');

        new Output(this, 'userPoolId', {
            value: this.cognito.userPool.userPoolId,
            export: `${this.name}:userPoolId`,
        });

        new Output(this, 'identityPoolId', {
            value: this.cognito.identityPool.identityPoolId,
            export: `${this.name}:identityPoolId`,
        });

        new Output(this, 'userPoolClientId', {
            value: this.cognito.userPoolClient.clientId,
            export: `${this.name}:userPoolClientId`,
        });
    }
}
