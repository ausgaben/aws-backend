import { LambdaSourcecodeStorageStack } from './stacks/lambda-sourcecode-storage';
import { SourceCodeStackName } from './app/sourcecode';
import * as fs from 'fs';
import { packBaseLayer } from '@nrfcloud/package-layered-lambdas';
import { lambdas } from './resources/lambdas';
import { AusgabenApp } from './app/ausgaben';

const path = require('path');

(async () => {
    const outDir = path.resolve(__dirname, '..', '..', 'pack');
    try {
        fs.statSync(outDir);
    } catch (_) {
        fs.mkdirSync(outDir);
    }
    const rootDir = path.resolve(__dirname, '..', '..');

    const Bucket = await LambdaSourcecodeStorageStack.getBucketName(
        SourceCodeStackName,
    );

    const layeredLambdas = await lambdas(rootDir, outDir, Bucket);

    new AusgabenApp(
        process.env.STACK_NAME,
        Bucket,
        await packBaseLayer({
            srcDir: rootDir,
            outDir,
            Bucket,
        }),
        layeredLambdas,
    ).run();
})();
