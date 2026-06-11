import {RefreshTokenGuard} from "./guards/refresh-token.guard.js";
import {Module} from "@nestjs/common";
import {ConfigModule} from "@nestjs/config";
import {AppJwtService} from "./services/app-jwt.service.js";
import {AccessTokenGuard} from "./guards/access-token.guard.js";
import {CookiesService} from "./services/cookies.service.js";
import {authZodConfig} from './configs/auth-zod.config.js';
import {CryptoService} from "./services/crypto.service.js";

@Module({
    imports: [
        ConfigModule.forFeature(authZodConfig),
    ],
    providers: [
        AppJwtService,
        CookiesService,
        AccessTokenGuard,
        RefreshTokenGuard,
        CryptoService
    ],
    exports: [
        CryptoService,
        AppJwtService,
        CookiesService,
        AccessTokenGuard,
        RefreshTokenGuard,
    ],
})
export class AuthCoreModule {
}