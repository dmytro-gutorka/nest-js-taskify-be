import type { CreateAuthInput, AuthEntity } from '../auth.types.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../../infrastructure/database/index.js';
import { Prisma, type AuthProvider } from '@database/client';
import { SortOrder } from '../../../common/index.js';

@Injectable()
export class AuthRepository {
    constructor(private readonly database: DatabaseService) {}

    create(createAuthDto: CreateAuthInput, tx?: Prisma.TransactionClient): Promise<AuthEntity> {
        const client = tx ?? this.database;

        return client.auth.create({
            data: createAuthDto,
        });
    }

    findManyByUserId(userId: number, tx?: Prisma.TransactionClient): Promise<AuthEntity[]> {
        const client = tx ?? this.database;

        return client.auth.findMany({
            where: {
                userId,
            },
            orderBy: {
                id: SortOrder.ASC,
            },
        });
    }

    findByEmailAndProvider(
        email: string,
        provider: AuthProvider,
        tx?: Prisma.TransactionClient,
    ): Promise<AuthEntity | null> {
        const client = tx ?? this.database;

        return client.auth.findFirst({
            where: {
                email,
                provider,
            },
        });
    }

    findByProviderAndProviderAccountId(
        provider: AuthProvider,
        providerAccountId: string,
        tx?: Prisma.TransactionClient,
    ): Promise<AuthEntity | null> {
        const client = tx ?? this.database;

        return client.auth.findFirst({
            where: {
                provider,
                providerAccountId,
            },
        });
    }

    findByUserIdAndProvider(
        userId: number,
        provider: AuthProvider,
        tx?: Prisma.TransactionClient,
    ): Promise<AuthEntity | null> {
        const client = tx ?? this.database;

        return client.auth.findFirst({
            where: {
                userId,
                provider,
            },
        });
    }

    async updatePassword(
        id: number,
        passwordHash: string,
        tx?: Prisma.TransactionClient,
    ): Promise<void> {
        const client = tx ?? this.database;

        try {
            await client.auth.update({
                where: { id },
                data: { password: passwordHash },
            });
        } catch {
            throw new NotFoundException(`Auth with id ${id} not found`);
        }
    }
}
