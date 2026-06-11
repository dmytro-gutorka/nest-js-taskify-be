import { ZodValidationPipe, type ActiveUser } from '../../common/index.js';
import { Controller, Post, Body, Res, HttpCode, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './services/auth.service.js';
import { AuthLocalService } from './services/auth-local.service.js';
import { SignUpLocalSchema } from './schemas/sign-up-local.schema.js';
import type { SignUpLocalDto, AccessToken, SignInLocalDto } from './auth.types.js';
import { SignInLocalSchema } from './schemas/sign-in-local.schema.js';
import { RefreshTokenGuard } from './guards/refresh-token.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import type { Response } from 'express';
import { CookiesService } from './services/cookies.service.js';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly cookiesService: CookiesService,
        private readonly authLocalService: AuthLocalService,
    ) {}

    @Post('sign-up')
    async signUp(
        @Body(new ZodValidationPipe(SignUpLocalSchema))
        body: SignUpLocalDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<AccessToken> {
        const tokens = await this.authLocalService.signUp(body);

        this.cookiesService.setRefreshTokenCookie(res, tokens.refreshToken);

        return {
            accessToken: tokens.accessToken,
        };
    }

    @Post('sign-in')
    @HttpCode(200)
    async signIn(
        @Body(new ZodValidationPipe(SignInLocalSchema))
        body: SignInLocalDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<AccessToken> {
        const tokens = await this.authLocalService.signIn(body);

        this.cookiesService.setRefreshTokenCookie(res, tokens.refreshToken);

        return {
            accessToken: tokens.accessToken,
        };
    }

    @Get('sign-out')
    @UseGuards(RefreshTokenGuard)
    signOut(@Res({ passthrough: true }) res: Response) {
        this.cookiesService.clearRefreshTokenCookie(res);

        return {
            message: 'Successfully signed out',
        };
    }

    @Get('refresh')
    @UseGuards(RefreshTokenGuard)
    refresh(
        @CurrentUser() user: ActiveUser,
        @Res({ passthrough: true }) res: Response,
    ): AccessToken {
        const tokens = this.authService.refreshToken(user);

        this.cookiesService.setRefreshTokenCookie(res, tokens.refreshToken);

        return {
            accessToken: tokens.accessToken,
        };
    }
}
