import {Module} from '@nestjs/common';
import {UsersModule} from '../users/index.js';
import {AuthController} from './auth.controller.js';
import {AuthRepository} from './repositories/auth.repository.js';
import {AuthService} from './services/auth.service.js';
import {AuthLocalService} from './services/auth-local.service.js';
import {AuthRegistrationService} from './services/auth-registration.service.js';
import {AuthCoreModule} from "./auth-core.module.js";

@Module({
    imports: [UsersModule, AuthCoreModule],
    controllers: [AuthController],
    providers: [
        AuthRepository,
        AuthService,
        AuthLocalService,
        AuthRegistrationService,
    ],
})
export class AuthModule {
}
