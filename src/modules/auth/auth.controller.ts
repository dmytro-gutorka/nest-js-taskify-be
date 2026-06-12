import type {
    SignUpLocalDto,
    AccessTokenResponse,
    SignInLocalDto,
    SetLocalPasswordDto,
    SignInGoogleDto,
    UpdatePrimaryEmailDto, ConfirmPasswordResetDto
} from './auth.types.js';
import type {Response} from 'express';
import {ZodValidationPipe, type ActiveUser} from '../../common/index.js';
import {Controller, Post, Body, Res, HttpCode, Get, UseGuards, Patch} from '@nestjs/common';
import {AuthService} from './services/auth.service.js';
import {AuthLocalService} from './services/auth-local.service.js';
import {SignUpLocalSchema} from './schemas/sign-up-local.schema.js';
import {SignInLocalSchema} from './schemas/sign-in-local.schema.js';
import {RefreshTokenGuard} from './guards/refresh-token.guard.js';
import {CurrentUser} from './decorators/current-user.decorator.js';
import {CookiesService} from './services/cookies.service.js';
import {AuthGoogleService} from "./services/auth-google.service.js";
import {SignInGoogleSchema} from "./schemas/sign-in-google.schema.js";
import {AccessTokenGuard} from "./guards/access-token.guard.js";
import {SetLocalPasswordSchema} from "./schemas/set-local-password.schema.js";
import {UpdatePrimaryEmailSchema} from "./schemas/update-primary-email.schema.js";
import {ConfirmPasswordResetSchema} from "./schemas/confirm-password-reset.schema.js";
import {PasswordResetService} from "./services/password-reset.service.js";

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly cookiesService: CookiesService,
        private readonly authLocalService: AuthLocalService,
        private readonly authGoogleService: AuthGoogleService,
        private readonly passwordResetService: PasswordResetService,
    ) {
    }

    @Post('sign-up')
    async signUp(
        @Body(new ZodValidationPipe(SignUpLocalSchema))
        body: SignUpLocalDto,
        @Res({passthrough: true}) res: Response,
    ): Promise<AccessTokenResponse> {
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
        @Res({passthrough: true}) res: Response,
    ): Promise<AccessTokenResponse> {
        const tokens = await this.authLocalService.signIn(body);

        this.cookiesService.setRefreshTokenCookie(res, tokens.refreshToken);

        return {
            accessToken: tokens.accessToken,
        };
    }

    @Get('sign-out')
    @UseGuards(RefreshTokenGuard)
    signOut(@Res({passthrough: true}) res: Response) {
        this.cookiesService.clearRefreshTokenCookie(res);

        return {
            message: 'Successfully signed out',
        };
    }

    @Get('refresh')
    @UseGuards(RefreshTokenGuard)
    refresh(
        @CurrentUser() user: ActiveUser,
        @Res({passthrough: true}) res: Response,
    ): AccessTokenResponse {
        const tokens = this.authService.refreshToken(user);

        this.cookiesService.setRefreshTokenCookie(res, tokens.refreshToken);

        return {
            accessToken: tokens.accessToken,
        };
    }

    @Post('google')
    @HttpCode(200)
    async signInGoogle(
        @Body(new ZodValidationPipe(SignInGoogleSchema))
        body: SignInGoogleDto,
        @Res({passthrough: true}) res: Response,
    ): Promise<AccessTokenResponse> {
        const tokens = await this.authGoogleService.signIn(body);

        this.cookiesService.setRefreshTokenCookie(res, tokens.refreshToken);

        return {
            accessToken: tokens.accessToken,
        };
    }

    @Post('google/link')
    @UseGuards(AccessTokenGuard)
    @HttpCode(200)
    async linkGoogle(
        @CurrentUser() user: ActiveUser,
        @Body(new ZodValidationPipe(SignInGoogleSchema))
        body: SignInGoogleDto,
    ) {
        await this.authGoogleService.link(user, body);

        return {
            message: 'Google account linked successfully',
        };
    }

    @Post('local/set-password')
    @UseGuards(AccessTokenGuard)
    @HttpCode(200)
    async setLocalPassword(
        @CurrentUser() user: ActiveUser,
        @Body(new ZodValidationPipe(SetLocalPasswordSchema))
        body: SetLocalPasswordDto,
    ) {
        await this.authLocalService.setPassword(user, body);

        return {
            message: 'Local password has been set successfully',
        };
    }

    @Get('primary-email-options')
    @UseGuards(AccessTokenGuard)
    getPrimaryEmailOptions(
        @CurrentUser() user: ActiveUser,
    ) {
        return this.authService.getPrimaryEmailOptions(user);
    }

    @Patch('primary-email')
    @UseGuards(AccessTokenGuard)
    updatePrimaryEmail(
        @CurrentUser() user: ActiveUser,
        @Body(new ZodValidationPipe(UpdatePrimaryEmailSchema))
        body: UpdatePrimaryEmailDto,
    ) {
        return this.authService.updatePrimaryEmail(user, body);
    }

    @Post('password-reset/request')
    @UseGuards(AccessTokenGuard)
    @HttpCode(200)
    requestPasswordReset(
        @CurrentUser() user: ActiveUser
    ) {
        return this.passwordResetService.requestAuthenticatedPasswordReset(user);
    }

    @Post('password-reset/confirm')
    @HttpCode(200)
    async confirmPasswordReset(
        @Body(new ZodValidationPipe(ConfirmPasswordResetSchema))
        body: ConfirmPasswordResetDto,
    ) {
        await this.passwordResetService.confirmPasswordReset(body);

        return {
            message: 'Password has been reset successfully',
        };
    }
}
