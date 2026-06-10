import { CryptoService } from './services/crypto.service.js';
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/index.js';
import { AuthController } from './auth.controller.js';
import { AuthRepository } from './repositories/auth.repository.js';
import { AppJwtService } from './services/app-jwt.service.js';
import { CookiesService } from './services/cookies.service.js';
import { AuthService } from './services/auth.service.js';
import { AuthLocalService } from './services/auth-local.service.js';
import { AuthRegistrationService } from './services/auth-registration.service.js';
import { AccessTokenGuard } from './guards/access-token.guard.js';
import { RefreshTokenGuard } from './guards/refresh-token.guard.js';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { authZodConfig } from './configs/auth-zod.config.js';

@Module({
    imports: [UsersModule, ConfigModule.forFeature(authZodConfig)],
    controllers: [AuthController],
    providers: [
        AuthRepository,
        AppJwtService,
        CryptoService,
        CookiesService,
        AuthService,
        AuthLocalService,
        AuthRegistrationService,
        AccessTokenGuard,
        RefreshTokenGuard,
        ConfigService,
    ],
    exports: [AccessTokenGuard, RefreshTokenGuard, AppJwtService],
})
export class AuthModule {}
