import { Module } from '@nestjs/common';
import { UsersModule } from '../users/index.js';
import { AuthController } from './auth.controller.js';
import { AuthRepository } from './repositories/auth.repository.js';
import { AuthService } from './services/auth.service.js';
import { AuthLocalService } from './services/auth-local.service.js';
import { AuthRegistrationService } from './services/auth-registration.service.js';
import { AuthCoreModule } from './auth-core.module.js';
import { AuthGoogleService } from './services/auth-google.service.js';
import { PasswordResetService } from './services/password-reset.service.js';
import { PasswordResetTokenRepository } from './repositories/password-reset-token.repository.js';
import { ConfigModule } from '@nestjs/config';
import { authEnvConfig } from './configs/auth-env.config.js';
import { NotificationModule } from '../notification/index.js';
import { RbacModule } from '../rbac/index.js';

@Module({
    imports: [
        UsersModule,
        AuthCoreModule,
        NotificationModule,
        RbacModule,
        ConfigModule.forFeature(authEnvConfig),
    ],
    controllers: [AuthController],
    providers: [
        AuthRepository,
        AuthService,
        AuthLocalService,
        AuthRegistrationService,
        AuthGoogleService,
        PasswordResetTokenRepository,
        PasswordResetService,
    ],
})
export class AuthModule {}
