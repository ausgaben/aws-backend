import { App, Output, Stack } from '@aws-cdk/cdk';
import { AggregateEventsTable } from '../resources/aggregate-events-table';
import { Cognito } from '../resources/cognito';
import { AccountsTable } from '../resources/accounts-table';
import { EventSourcingFeature } from '../features/eventsourcing';
import { Code, LayerVersion, Runtime } from '@aws-cdk/aws-lambda';
import { Bucket } from '@aws-cdk/aws-s3';
import { AusgabenLayeredLambdas } from '../resources/lambdas';
import { ApiFeature } from '../features/api';
import { AccountUsersTable } from '../resources/account-users-table';

export class CoreStack extends Stack {
    public readonly aggregateEventsTable: AggregateEventsTable;
    public readonly accountsTable: AccountsTable;
    public readonly accountUsersTable: AccountUsersTable;
    public readonly cognito: Cognito;

    constructor(
        parent: App,
        id: string,
        sourceCodeBucketName: string,
        baseLayerZipFileName: string,
        layeredLambdas: AusgabenLayeredLambdas,
    ) {
        super(parent, id);

        this.aggregateEventsTable = new AggregateEventsTable(
            this,
            'aggregateEventsTable',
        );
        new Output(this, 'aggregateEventsTableName', {
            value: this.aggregateEventsTable.table.tableName,
            export: `${this.name}:aggregateEventsTableName`,
        });

        this.accountsTable = new AccountsTable(this, 'accountsTable');

        new Output(this, 'accountsTableName', {
            value: this.accountsTable.table.tableName,
            export: `${this.name}:accountsTableName`,
        });

        this.accountUsersTable = new AccountUsersTable(
            this,
            'accountUsersTable',
        );

        new Output(this, 'accountUsersTableName', {
            value: this.accountUsersTable.table.tableName,
            export: `${this.name}:accountUsersTableName`,
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

        const sourceCodeBucket = Bucket.import(this, 'SourceCodeBucket', {
            bucketName: sourceCodeBucketName,
        });

        const baseLayer = new LayerVersion(this, `${id}-layer`, {
            code: Code.bucket(sourceCodeBucket, baseLayerZipFileName),
            compatibleRuntimes: [Runtime.NodeJS810],
        });

        new EventSourcingFeature(
            this,
            'eventsourcing',
            Code.bucket(
                sourceCodeBucket,
                layeredLambdas.lambdaZipFileNames.eventReducer,
            ),
            baseLayer,
            this.aggregateEventsTable,
            this.accountsTable,
            this.accountUsersTable,
        );

        const api = new ApiFeature(
            this,
            'api',
            {
                createAccountMutation: Code.bucket(
                    sourceCodeBucket,
                    layeredLambdas.lambdaZipFileNames.createAccountMutation,
                ),
                deleteAccountMutation: Code.bucket(
                    sourceCodeBucket,
                    layeredLambdas.lambdaZipFileNames.deleteAccountMutation,
                ),
                accountsQuery: Code.bucket(
                    sourceCodeBucket,
                    layeredLambdas.lambdaZipFileNames.accountsQuery,
                ),
            },
            baseLayer,
            this.aggregateEventsTable,
            this.accountsTable,
            this.accountUsersTable,
            this.cognito.userRole,
        );

        new Output(this, 'apiUrl', {
            value: api.api.graphQlApiGraphQlUrl,
            export: `${this.name}:apiUrl`,
        });
    }
}
