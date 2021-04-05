import { GetParametersByPathCommand, SSMClient } from '@aws-sdk/client-ssm'

export const getClientConfig = async ({
	stackName,
	ssm,
}: {
	stackName: string
	ssm: SSMClient
}): Promise<Record<string, string>> => {
	const Path = `/${stackName}/sparebank1.no`
	const { Parameters } = await ssm.send(
		new GetParametersByPathCommand({
			Path,
			Recursive: true,
		}),
	)

	if (Parameters === undefined || Parameters?.length === 0)
		throw new Error(`OAuth client not configured: ${Path}!`)

	return Parameters.map(({ Name, ...rest }) => ({
		...rest,
		Name: Name?.replace(`${Path}/`, ''),
	})).reduce(
		(settings, { Name, Value }) => ({
			...settings,
			[Name ?? '']: Value ?? '',
		}),
		{} as Record<string, string>,
	)
}
