import type { AuthEntity, AuthRegisterInput } from '../auth.types.js';
import { Injectable } from '@nestjs/common';
import { AuthRepository } from '../repositories/auth.repository.js';
import { CryptoService } from './crypto.service.js';
import { UsersRepository } from '../../users/repositories/users.repository.js';
import { DatabaseService } from '../../../infrastructure/database/index.js';
import { RbacService } from '../../rbac/services/rbac.service.js';
// @gutnidev у тебя есть @database/enums
import { RoleName } from '../../../infrastructure/database/prisma/generated/enums.js';

@Injectable()
export class AuthRegistrationService {
    constructor(
        private readonly database: DatabaseService,
        // @gutnidev тут должен быть UserService, а не репозиторий. Репозиторий существует, чтобы внутри своего модуля обслуживать свои сервисы.
        // @gutnidev чужие модули не импортируют репозиториями, они импортируют сервисы.
        private readonly usersRepository: UsersRepository,
        private readonly cryptoService: CryptoService,
        private readonly authRepository: AuthRepository,
        private readonly rbacService: RbacService,
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

                // @gutnidev тут ты вообще забил даже на репозиторий, который тут не должен быть, а просто напрямую херачишь из чужого модуля в таблицу users.
                const user = existingUser ?? (await tx.user.create(userData));
                authUserId = user.id;
            }

            if (password) {
                hashedPassword = await this.cryptoService.hash(password);
            }

            const auth = await this.authRepository.create(
                {
                    userId: authUserId,
                    email,
                    password: hashedPassword,
                    provider,
                    providerAccountId,
                },
                tx,
            );

            // @gutnidev у тебя по умолчанию все кто регистрируются - админы.
            await this.rbacService.assignRoleToUser(authUserId, RoleName.ADMIN, tx);

            return auth;
        });
    }
}
