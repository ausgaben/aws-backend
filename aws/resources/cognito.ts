import { Construct, Stack } from '@aws-cdk/cdk';
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
            signInType: SignInType.Email,
            autoVerifiedAttributes: [UserPoolAttribute.Email],
        });
        this.userPoolClient = new UserPoolClient(this, 'userPoolClient', {
            userPool: this.userPool,
        });
        this.identityPool = new CfnIdentityPool(this, 'idPool', {
            allowUnauthenticatedIdentities: false,
            cognitoIdentityProviders: [
                {
                    clientId: this.userPoolClient.clientId,
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
