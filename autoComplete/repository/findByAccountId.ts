export type findByAccountId = (args: {
    accountId: string;
}) => Promise<{
    [field: string]: string[];
}>;
