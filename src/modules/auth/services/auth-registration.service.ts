import type { AuthEntity, AuthRegisterInput } from '../auth.types.js';
import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository.js';
import { CryptoService } from './crypto.service.js';
import { UsersRepository } from '../../users/repositories/users.repository.js';
import { DatabaseService } from '../../../infrastructure/database/index.js';

@Injectable()
export class AuthRegistrationService {
    constructor(
        private readonly database: DatabaseService,
        private readonly usersRepository: UsersRepository,
        private readonly cryptoService: CryptoService,
        private readonly authRepository: AuthRepository,
    ) {}

    async registerUserWithAuth({
        providerAccountId = null,
        password,
        provider,
        userId,
        email,
        name,
    }: AuthRegisterInput): Promise<AuthEntity> {
        return this.database.$transaction(async (tx) => {
            let authUserId = userId;
            let hashedPassword: string | null = null;

            if (!authUserId) {
                const existingUser = await this.usersRepository.findByEmail(email);
                const userData = {
                    data: { email, name },
                };

                const user = existingUser ?? (await tx.user.create(userData));
                authUserId = user.id;
            }

            if (password) {
                hashedPassword = await this.cryptoService.hash(password);
            }

            return this.authRepository.create(
                {
                    userId: authUserId,
                    email,
                    password: hashedPassword,
                    provider,
                    providerAccountId,
                },
                tx,
            );
        });
    }
}
