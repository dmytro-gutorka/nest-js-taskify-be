import { UnauthorizedException, Injectable, Inject } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import type { TokensPair } from '../auth.types.js';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { authEnvConfig } from '../configs/auth-env.config.js';
import { ActiveUserSchema } from '../schemas/active-user.schema.js';
import { ActiveUser } from '../../../common/types/common.types.js';

@Injectable()
export class AppJwtService {
    constructor(
        @Inject(authEnvConfig.KEY)
        private readonly config: ConfigType<typeof authEnvConfig>,
    ) {}

    signAccessToken(payload: ActiveUser): string {
        return jwt.sign(payload, this.getJwtSecret(), {
            expiresIn: this.config.accessTokenTtl,
        } satisfies SignOptions);
    }

    signRefreshToken(payload: ActiveUser): string {
        return jwt.sign(payload, this.getJwtSecret(), {
            expiresIn: this.config.refreshTokenTtl,
        } satisfies SignOptions);
    }

    signTokensPair(payload: ActiveUser): TokensPair {
        const accessToken = this.signAccessToken(payload);
        const refreshToken = this.signRefreshToken(payload);

        return {
            accessToken,
            refreshToken,
        };
    }

    async verify(token: string): Promise<ActiveUser> {
        try {
            const decoded = jwt.verify(token, this.getJwtSecret());

            return await ActiveUserSchema.parseAsync(decoded);
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    private getJwtSecret(): string {
        return this.config.jwtSecret;
    }
}
