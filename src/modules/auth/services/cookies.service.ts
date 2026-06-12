import { type ConfigType } from '@nestjs/config';
import { Injectable, Inject } from '@nestjs/common';
import type { Response } from 'express';
import { authEnvConfig } from '../configs/auth-env.config.js';
import { REFRESH_TOKEN_COOKIE_NAME } from '@common/constants';

@Injectable()
export class CookiesService {
    constructor(
        @Inject(authEnvConfig.KEY)
        private readonly config: ConfigType<typeof authEnvConfig>,
    ) {}

    setRefreshTokenCookie(res: Response, refreshToken: string): void {
        const refreshTokenTtl = this.config.refreshTokenTtl;
        const appEnv = this.config.appEnvironment;

        res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
            httpOnly: true,
            sameSite: true,
            secure: appEnv === 'prod',
            maxAge: refreshTokenTtl * 1000,
        });
    }

    clearRefreshTokenCookie(res: Response): void {
        res.clearCookie(REFRESH_TOKEN_COOKIE_NAME);
    }
}
