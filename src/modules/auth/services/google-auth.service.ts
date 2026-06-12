import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { type ConfigType } from '@nestjs/config';
import { authEnvConfig } from '../configs/auth-env.config.js';
import { VerifiedGoogleUser } from '../auth.types.js';

@Injectable()
export class GoogleAuthService {
    private readonly client: OAuth2Client;

    constructor(
        @Inject(authEnvConfig.KEY)
        private readonly config: ConfigType<typeof authEnvConfig>,
    ) {
        this.client = new OAuth2Client(this.config.googleClientId);
    }

    async verifyCredential(credential: string): Promise<VerifiedGoogleUser> {
        let payload: TokenPayload | undefined;

        try {
            const ticket = await this.client.verifyIdToken({
                idToken: credential,
                audience: this.config.googleClientId,
            });

            payload = ticket.getPayload();
        } catch {
            throw new UnauthorizedException('Invalid Google credential');
        }

        if (!payload?.sub || !payload.email) {
            throw new UnauthorizedException('Invalid Google credential');
        }

        return {
            providerAccountId: payload.sub,
            email: payload.email,
            name: payload.name,
        };
    }
}
