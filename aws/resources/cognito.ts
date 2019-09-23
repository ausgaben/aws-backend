import { Construct, Stack } from '@aws-cdk/core';
import {
    CfnIdentityPool,
    CfnIdentityPoolRoleAttachment,
    IUserPool,
    SignInType,
    UserPool,
    UserPoolAttribute,
    UserPoolClient,
} from '@aws-cdk/aws-cognito';

import { FederatedPrincipal, Role } from '@aws-cdk/aws-iam';

export class Cognito extends Construct {
    public readonly userPool: IUserPool;
    public readonly userRole: Role;
    public readonly identityPool: CfnIdentityPool;
    public readonly userPoolClient: UserPoolClient;

    constructor(stack: Stack, id: string) {
        super(stack, id);
        this.userPool = new UserPool(this, 'userPool', {
            signInType: SignInType.EMAIL,
            autoVerifiedAttributes: [UserPoolAttribute.EMAIL],
        });
        this.userPoolClient = new UserPoolClient(this, 'userPoolClient', {
            userPool: this.userPool,
        });
        this.identityPool = new CfnIdentityPool(this, 'idPool', {
            allowUnauthenticatedIdentities: false,
            cognitoIdentityProviders: [
                {
                    clientId: this.userPoolClient.userPoolClientId,
                    providerName: this.userPool.userPoolProviderName,
                },
            ],
            developerProviderName: 'developerLogin',
        });

        this.userRole = new Role(this, 'userRole', {
            assumedBy: new FederatedPrincipal(
                'cognito-identity.amazonaws.com',
                {
                    StringEquals: {
                        'cognito-identity.amazonaws.com:aud': this.identityPool
                            .ref,
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
                                .identityPool.ref,
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
            identityPoolId: this.identityPool.ref,
            roles: {
                authenticated: this.userRole.roleArn,
                unauthenticated: unauthenticatedUserRole.roleArn,
            },
        });
    }
}
