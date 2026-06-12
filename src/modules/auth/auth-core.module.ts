import {RefreshTokenGuard} from "./guards/refresh-token.guard.js";
import {Module} from "@nestjs/common";
import {ConfigModule} from "@nestjs/config";
import {AppJwtService} from "./services/app-jwt.service.js";
import {AccessTokenGuard} from "./guards/access-token.guard.js";
import {CookiesService} from "./services/cookies.service.js";
import {authEnvConfig} from './configs/auth-env.config.js';
import {CryptoService} from "./services/crypto.service.js";
import {GoogleAuthService} from "./services/google-auth.service.js";

@Module({
    imports: [
        ConfigModule.forFeature(authEnvConfig),
    ],
    providers: [
        AppJwtService,
        CookiesService,
        AccessTokenGuard,
        RefreshTokenGuard,
        CryptoService,
        GoogleAuthService,
    ],
    exports: [
        AppJwtService,
        CryptoService,
        CookiesService,
        AccessTokenGuard,
        RefreshTokenGuard,
        GoogleAuthService,
    ],
})
export class AuthCoreModule {
}