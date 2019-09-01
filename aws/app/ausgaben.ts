import { App } from '@aws-cdk/core';
import { AusgabenLayeredLambdas } from '../resources/lambdas';
import { CoreStack } from '../stacks/core';

export class AusgabenApp extends App {
    constructor(
        stackName: string = 'ausgaben-dev',
        sourceCodeBucketName: string,
        baseLayerZipFileName: string,
        layeredLambdas: AusgabenLayeredLambdas,
    ) {
        super();

        new CoreStack(
            this,
            stackName,
            sourceCodeBucketName,
            baseLayerZipFileName,
            layeredLambdas,
        );
    }
}
