import { AuthProvider } from '../../../infrastructure/database/prisma/generated/enums.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import { AppJwtService } from './app-jwt.service.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import { Prisma } from '@database/client';
import type { ActiveUser } from '@common/types';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: AppJwtService,
        private readonly authRepository: AuthRepository,
    ) {}

    async findLocalAuthByUserId(userId: number, tx?: Prisma.TransactionClient) {
        const auth = await this.authRepository.findByUserIdAndProvider(
            userId,
            AuthProvider.LOCAL,
            tx,
        );

        if (!auth) throw new NotFoundException('Auth account not found');

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
}
