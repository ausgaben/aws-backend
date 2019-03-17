import { Stack, Construct } from '@aws-cdk/cdk';
import {
    AuthFlow,
    CfnIdentityPool,
    CfnIdentityPoolRoleAttachment,
    UserPool,
    UserPoolClient,
} from '@aws-cdk/aws-cognito';

import { FederatedPrincipal, Role } from '@aws-cdk/aws-iam';

export class Cognito extends Construct {
    public readonly userPool: UserPool;
    public readonly userRole: Role;
    public readonly identityPool: CfnIdentityPool;
    public readonly userPoolClient: UserPoolClient;

    constructor(stack: Stack, id: string) {
        super(stack, id);

        this.userPool = new UserPool(this, 'userPool', {});
        this.userPoolClient = new UserPoolClient(this, 'userPoolClient', {
            userPool: this.userPool,
            enabledAuthFlows: [AuthFlow.AdminNoSrp],
        });
        this.identityPool = new CfnIdentityPool(this, 'identityPool', {
            allowUnauthenticatedIdentities: false,
            cognitoIdentityProviders: [
                {
                    clientId: this.userPoolClient.clientId,
                    providerName: this.userPool.userPoolProviderName,
                },
            ],
            developerProviderName: 'iris-backend',
        });

        this.userRole = new Role(this, 'userRole', {
            assumedBy: new FederatedPrincipal(
                'cognito-identity.amazonaws.com',
                {
                    StringEquals: {
                        'cognito-identity.amazonaws.com:aud': this.identityPool
                            .identityPoolId,
                    },
                    'ForAnyValue:StringLike': {
                        'cognito-identity.amazonaws.com:amr': 'authenticated',
                    },
                },
                'sts:AssumeRoleWithWebIdentity',
            ),
        });

        const unauthenticatedUserRole = new Role(
            this,
            'unauthenticatedUserRole',
            {
                assumedBy: new FederatedPrincipal(
                    'cognito-identity.amazonaws.com',
                    {
                        StringEquals: {
                            'cognito-identity.amazonaws.com:aud': this
                                .identityPool.identityPoolId,
                        },
                        'ForAnyValue:StringLike': {
                            'cognito-identity.amazonaws.com:amr':
                                'unauthenticated',
                        },
                    },
                    'sts:AssumeRoleWithWebIdentity',
                ),
            },
        );

        new CfnIdentityPoolRoleAttachment(this, 'identityPoolRoles', {
            identityPoolId: this.identityPool.identityPoolId,
            roles: {
                authenticated: this.userRole.roleArn,
                unauthenticated: unauthenticatedUserRole.roleArn,
            },
        });
    }
}
