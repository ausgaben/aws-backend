import { createAccountUser } from '../commands/createAccountUser';

const fs = require('fs').promises;
import { findByUserId } from '../accountUser/repository/dynamodb/findByUserId';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb-v2-node';
import { persist as persistDynamoDB } from '../eventsourcing/aggregateEventRepository/dynamodb/persist';
import { createAccount } from '../commands/createAccount';
import { createSpending } from '../commands/createSpending';

const db = new DynamoDBClient({});
const aggregateEventsTableName = process.env.AGGREGATE_EVENTS_TABLE!;
const accountUsersTableName = process.env.ACCOUNT_USERS_TABLE!;

const findAccountUserByUserId = findByUserId(db, accountUsersTableName);
const persist = persistDynamoDB(db, aggregateEventsTableName);
const addSpending = createSpending(persist, findAccountUserByUserId);
const addAccount = createAccount(persist);
const addAcountUser = createAccountUser(persist);

const userId = 'eu-central-1:104f552c-c388-4bbc-901e-eb70da91b473';

(async () => {
    const importId = `${Math.random()
        .toString(36)
        .replace(/[^a-z]+/g, '')}@${new Date().toISOString().substr(0, 10)}`;
    const [accounts, spendings] = (await Promise.all([
        fs
            .readFile(process.argv[process.argv.length - 2], 'utf-8')
            .then(JSON.parse),
        fs.readFile(process.argv[process.argv.length - 1]).then(JSON.parse),
    ])) as [
        { id: string; name: string }[],
        {
            checkingAccount: string;
            author: {
                email: {
                    email: string;
                };
                firstname: string;
                lastname: string;
                password: string;
                isActive: boolean;
                activatedAt: number;
            };
            category: string;
            title: string;
            amount: number;
            booked: boolean;
            bookedAt: number;
            saving: boolean;
        }[]
    ];

    await accounts.reduce(
        (promise, { id, name }) =>
            promise.then(async () => {
                const accountSpendings = spendings.filter(
                    ({ checkingAccount }) => checkingAccount === id,
                );
                const accountName = `${name} [${importId}]`;
                console.log(accountName);
                const { aggregateId } = await addAccount({
                    name: accountName,
                    isSavingsAccount: false,
                    userId,
                });
                await addAcountUser({
                    accountId: aggregateId,
                    userId,
                });

                await new Promise(resolve => {
                    setTimeout(resolve, 1000);
                });

                console.log(`${accountSpendings.length} spendings`);

                await accountSpendings
                    .filter(({ amount }) => amount !== 0)
                    .reduce(
                        (
                            promise,
                            {
                                category,
                                title,
                                amount,
                                booked = false,
                                bookedAt,
                            },
                        ) =>
                            promise.then(async () => {
                                await addSpending({
                                    userId,
                                    accountId: aggregateId,
                                    category,
                                    description: title,
                                    amount,
                                    booked,
                                    bookedAt: new Date(bookedAt).toISOString(),
                                    currencyId:
                                        name.indexOf('NOK') > 0 ? 'NOK' : 'EUR',
                                });
                            }),
                        Promise.resolve(),
                    );
            }),
        Promise.resolve(),
    );
})();