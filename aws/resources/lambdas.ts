import * as path from 'path';
import { LayeredLambdas } from '@nrfcloud/package-layered-lambdas';
import { packLayeredLambdasForCloudFormation } from '../packLambdas';

export type AusgabenLayeredLambdas = LayeredLambdas<{
    eventReducer: string;
    createAccountMutation: string;
    deleteAccountMutation: string;
    accountsQuery: string;
    createSpendingMutation: string;
    deleteSpendingMutation: string;
    spendingsQuery: string;
}>;

export const lambdas = async (
    rootDir: string,
    outDir: string,
    Bucket: string,
): Promise<AusgabenLayeredLambdas> =>
    packLayeredLambdasForCloudFormation('ausgaben', outDir, Bucket, {
        eventReducer: path.resolve(
            rootDir,
            'eventsourcing',
            'reducer',
            'eventReducer.ts',
        ),
        createAccountMutation: path.resolve(
            rootDir,
            'appsync',
            'mutations',
            'createAccount.ts',
        ),
        deleteAccountMutation: path.resolve(
            rootDir,
            'appsync',
            'mutations',
            'deleteAccount.ts',
        ),
        accountsQuery: path.resolve(
            rootDir,
            'appsync',
            'queries',
            'accounts.ts',
        ),
        createSpendingMutation: path.resolve(
            rootDir,
            'appsync',
            'mutations',
            'createSpending.ts',
        ),
        deleteSpendingMutation: path.resolve(
            rootDir,
            'appsync',
            'mutations',
            'deleteSpending.ts',
        ),
        spendingsQuery: path.resolve(
            rootDir,
            'appsync',
            'queries',
            'spendings.ts',
        ),
    });
