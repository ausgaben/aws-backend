import { App } from '@aws-cdk/cdk';
import { CoreStack } from './core';

class AusgabenApp extends App {
    constructor(stackName: string = 'ausgaben-dev') {
        super();

        new CoreStack(this, stackName);
    }
}

(async () => {
    new AusgabenApp(process.env.STACK_NAME).run();
})();
