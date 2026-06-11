import {AppJwtService} from "./app-jwt.service.js";
import {Injectable, ConflictException, BadRequestException} from "@nestjs/common";
import {GoogleAuthService} from "./google-auth.service.js";
import {AuthRepository} from "../repositories/auth.repository.js";
import {AuthRegistrationService} from "./auth-registration.service.js";
import {TokensPair, SignInGoogleDto} from "../auth.types.js";
import {AuthProvider} from "../../../infrastructure/database/prisma/generated/enums.js";
import {ActiveUser} from "../../../common/index.js";

@Injectable()
export class AuthGoogleService {
    constructor(
        private readonly jwtService: AppJwtService,
        private readonly googleAuthService: GoogleAuthService,
        private readonly authRepository: AuthRepository,
        private readonly authRegistrationService: AuthRegistrationService,
    ) {
    }

    async signIn(signInGoogleDto: SignInGoogleDto): Promise<TokensPair> {
        const googleUser = await this.googleAuthService.verifyCredential(
            signInGoogleDto.idToken,
        );

        const existingGoogleAuth =
            await this.authRepository.findByProviderAndProviderAccountId(
                AuthProvider.GOOGLE,
                googleUser.providerAccountId,
            );

        if (existingGoogleAuth) {
            return this.jwtService.signTokensPair({
                id: existingGoogleAuth.userId,
                email: existingGoogleAuth.email,
                provider: existingGoogleAuth.provider,
            });
        }

        const existingLocalAuth = await this.authRepository.findByEmailAndProvider(
            googleUser.email,
            AuthProvider.LOCAL,
        );

        if (existingLocalAuth) {
            throw new ConflictException(
                'Account already exists with local login. Sign in with password and link Google in Profile/Security.',
            );
        }

        const auth = await this.authRegistrationService.registerUserWithAuth({
            provider: AuthProvider.GOOGLE,
            email: googleUser.email,
            name: googleUser.name,
            providerAccountId: googleUser.providerAccountId,
        });

        return this.jwtService.signTokensPair({
            id: auth.userId,
            email: auth.email,
            provider: auth.provider,
        });
    }

    async link(
        activeUser: ActiveUser,
        linkGoogleDto: SignInGoogleDto,
    ): Promise<void> {
        const googleUser = await this.googleAuthService.verifyCredential(
            linkGoogleDto.idToken,
        );

        const existingGoogleAuth =
            await this.authRepository.findByProviderAndProviderAccountId(
                AuthProvider.GOOGLE,
                googleUser.providerAccountId,
            );

        if (existingGoogleAuth) {
            throw new ConflictException('Google account is already linked');
        }

        const existingGoogleAuthByUser =
            await this.authRepository.findByUserIdAndProvider(
                activeUser.id,
                AuthProvider.GOOGLE,
            );

        if (existingGoogleAuthByUser) {
            throw new ConflictException('Current user already has linked Google auth');
        }

        if (googleUser.email !== activeUser.email) {
            throw new BadRequestException(
                'Google account email must match current user email',
            );
        }

        await this.authRegistrationService.registerUserWithAuth({
            provider: AuthProvider.GOOGLE,
            email: googleUser.email,
            name: googleUser.name,
            userId: activeUser.id,
            providerAccountId: googleUser.providerAccountId,
        });
    }
}