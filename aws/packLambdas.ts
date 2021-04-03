import * as path from 'path'
import {
	LayeredLambdas,
	packLayeredLambdas,
} from '@nordicsemiconductor/package-layered-lambdas'

const rootFolder = path.resolve(__dirname, '..', '..')

export const tsConfig = path.resolve(__dirname, '..', '..', 'tsconfig.json')

export const packLayeredLambdasForCloudFormation = async <
	A extends { [key: string]: string }
>(
	id: string,
	outDir: string,
	Bucket: string,
	lambdas: A,
): Promise<LayeredLambdas<A>> =>
	packLayeredLambdas<A>({
		id,
		srcDir: rootFolder,
		outDir,
		Bucket,
		lambdas,
		tsConfig,
	})
