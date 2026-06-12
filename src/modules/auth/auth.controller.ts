import type { AccessTokenResponse } from './auth.types.js';
import type { Response } from 'express';
import { Controller, Post, Body, Res, HttpCode, Get, UseGuards, Patch } from '@nestjs/common';
import { AuthService } from './services/auth.service.js';
import { AuthLocalService } from './services/auth-local.service.js';
import { RefreshTokenGuard } from './guards/refresh-token.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { CookiesService } from './services/cookies.service.js';
import { AuthGoogleService } from './services/auth-google.service.js';
import { PasswordResetService } from './services/password-reset.service.js';
import { SignUpLocalDto } from './dto/sign-up-local.dto.js';
import { SignInLocalDto } from './dto/sign-in-local.dto.js';
import { type ActiveUser } from '../../common/types/common.types.js';
import { SignInGoogleDto } from './dto/sign-in-google.dto.js';
import { SetLocalPasswordDto } from './dto/set-local-password.dto.js';
import { UpdatePrimaryEmailDto } from './dto/update-primary-email.dto.js';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto.js';
import { SkipAccessToken } from '../../common/decorators/skip-access-token.decorator.js';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly cookiesService: CookiesService,
        private readonly authLocalService: AuthLocalService,
        private readonly authGoogleService: AuthGoogleService,
        private readonly passwordResetService: PasswordResetService,
    ) {}

    @Post('sign-up')
    @SkipAccessToken()
    async signUp(
        @Body() body: SignUpLocalDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<AccessTokenResponse> {
        const tokens = await this.authLocalService.signUp(body);

        this.cookiesService.setRefreshTokenCookie(res, tokens.refreshToken);

        return {
            accessToken: tokens.accessToken,
        };
    }

    @Post('sign-in')
    @SkipAccessToken()
    @HttpCode(200)
    async signIn(
        @Body() body: SignInLocalDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<AccessTokenResponse> {
        const tokens = await this.authLocalService.signIn(body);

        this.cookiesService.setRefreshTokenCookie(res, tokens.refreshToken);

        return {
            accessToken: tokens.accessToken,
        };
    }

    @Get('sign-out')
    @SkipAccessToken()
    signOut(@Res({ passthrough: true }) res: Response) {
        this.cookiesService.clearRefreshTokenCookie(res);

        return {
            message: 'Successfully signed out',
        };
    }

    @Get('refresh')
    @SkipAccessToken()
    @UseGuards(RefreshTokenGuard)
    refresh(
        @CurrentUser() user: ActiveUser,
        @Res({ passthrough: true }) res: Response,
    ): AccessTokenResponse {
        const tokens = this.authService.refreshToken(user);

        this.cookiesService.setRefreshTokenCookie(res, tokens.refreshToken);

        return {
            accessToken: tokens.accessToken,
        };
    }

    @Post('google')
    @SkipAccessToken()
    @HttpCode(200)
    async signInGoogle(
        @Body() body: SignInGoogleDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<AccessTokenResponse> {
        const tokens = await this.authGoogleService.signIn(body);

        this.cookiesService.setRefreshTokenCookie(res, tokens.refreshToken);

        return {
            accessToken: tokens.accessToken,
        };
    }

    @Post('google/link')
    @HttpCode(200)
    async linkGoogle(@CurrentUser() user: ActiveUser, @Body() body: SignInGoogleDto) {
        await this.authGoogleService.link(user, body);

        return {
            message: 'Google account linked successfully',
        };
    }

    @Post('local/set-password')
    @HttpCode(200)
    async setLocalPassword(@CurrentUser() user: ActiveUser, @Body() body: SetLocalPasswordDto) {
        await this.authLocalService.setPassword(user, body);

        return {
            message: 'Local password has been set successfully',
        };
    }

    @Get('primary-email-options')
    getPrimaryEmailOptions(@CurrentUser() user: ActiveUser) {
        return this.authService.getPrimaryEmailOptions(user);
    }

    @Patch('primary-email')
    updatePrimaryEmail(@CurrentUser() user: ActiveUser, @Body() body: UpdatePrimaryEmailDto) {
        return this.authService.updatePrimaryEmail(user, body);
    }

    @Post('password-reset/request')
    @HttpCode(200)
    requestPasswordReset(@CurrentUser() user: ActiveUser) {
        return this.passwordResetService.requestAuthenticatedPasswordReset(user);
    }

    @Post('password-reset/confirm')
    @SkipAccessToken()
    @HttpCode(200)
    async confirmPasswordReset(@Body() body: ConfirmPasswordResetDto) {
        await this.passwordResetService.confirmPasswordReset(body);

        return {
            message: 'Password has been reset successfully',
        };
    }
}
