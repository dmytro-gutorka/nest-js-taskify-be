import { AuthProvider } from '../../../infrastructure/database/prisma/generated/enums.js';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AppJwtService } from './app-jwt.service.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import { Prisma } from '@database/client';
import { UsersService } from '../../users/services/users.service.js';
import { PrimaryEmailOptionsResponse } from '../auth.types.js';
import { ActiveUser } from '../../../common/types/common.types.js';
import { UpdatePrimaryEmailDto } from '../dto/update-primary-email.dto.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: AppJwtService,
        private readonly authRepository: AuthRepository,
        private readonly usersService: UsersService,
    ) {}

    async findLocalAuthByUserId(userId: number, tx?: Prisma.TransactionClient) {
        const auth = await this.authRepository.findByUserIdAndProvider(
            userId,
            AuthProvider.LOCAL,
            tx,
        );

        if (!auth) {
            throw new NotFoundException('Auth account not found');
        }

        return auth;
    }

    async updatePassword(
        authId: number,
        passwordHash: string,
        tx?: Prisma.TransactionClient,
    ): Promise<void> {
        await this.authRepository.updatePassword(authId, passwordHash, tx);
    }

    refreshToken(activeUser: ActiveUser) {
        return this.jwtService.signTokensPair(activeUser);
    }

    async getPrimaryEmailOptions(activeUser: ActiveUser): Promise<PrimaryEmailOptionsResponse> {
        const authAccounts = await this.authRepository.findManyByUserId(activeUser.id);

        const emailToProvidersMap = new Map<string, AuthProvider[]>();

        for (const authAccount of authAccounts) {
            const providers = emailToProvidersMap.get(authAccount.email) ?? [];

            providers.push(authAccount.provider);

            emailToProvidersMap.set(authAccount.email, providers);
        }

        return {
            options: [...emailToProvidersMap.entries()].map(([email, providers]) => ({
                email,
                providers,
                isPrimary: email === activeUser.email,
            })),
        };
    }

    async updatePrimaryEmail(activeUser: ActiveUser, updatePrimaryEmailDto: UpdatePrimaryEmailDto) {
        const authAccounts = await this.authRepository.findManyByUserId(activeUser.id);

        const canUseEmail = authAccounts.some(
            (authAccount) => authAccount.email === updatePrimaryEmailDto.email,
        );

        if (!canUseEmail) {
            throw new BadRequestException('Email must belong to one of linked auth accounts');
        }

        return this.usersService.updatePrimaryEmail(activeUser.id, updatePrimaryEmailDto.email);
    }
}
