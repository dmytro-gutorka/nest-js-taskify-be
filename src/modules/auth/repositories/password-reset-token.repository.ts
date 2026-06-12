import { Injectable } from '@nestjs/common';
import { CreatePasswordResetTokenInput, PasswordResetTokenEntity } from '../auth.types.js';
import { DatabaseService } from '../../../infrastructure/database/index.js';
import { Prisma } from '@database/client';

@Injectable()
export class PasswordResetTokenRepository {
    constructor(private readonly database: DatabaseService) {}

    async deleteInactiveOlderThan(olderThan: Date, tx?: Prisma.TransactionClient): Promise<number> {
        const client = tx ?? this.database;

        const result = await client.passwordResetToken.deleteMany({
            where: {
                OR: [
                    { usedAt: { not: null } },
                    {
                        revokedAt: { not: null },
                    },
                    { expiresAt: { lt: new Date() } },
                ],
                createdAt: { lt: olderThan },
            },
        });

        return result.count;
    }

    create(
        input: CreatePasswordResetTokenInput,
        tx?: Prisma.TransactionClient,
    ): Promise<PasswordResetTokenEntity> {
        const client = tx ?? this.database;

        return client.passwordResetToken.create({
            data: input,
        });
    }

    findByTokenHash(
        tokenHash: string,
        tx?: Prisma.TransactionClient,
    ): Promise<PasswordResetTokenEntity | null> {
        const client = tx ?? this.database;

        return client.passwordResetToken.findUnique({
            where: {
                tokenHash,
            },
        });
    }

    async revokeActiveByUserId(userId: number, tx?: Prisma.TransactionClient): Promise<void> {
        const client = tx ?? this.database;

        await client.passwordResetToken.updateMany({
            where: {
                userId,
                usedAt: null,
                revokedAt: null,
                expiresAt: {
                    gt: new Date(),
                },
            },
            data: {
                revokedAt: new Date(),
            },
        });
    }

    async markUsed(id: number, tx?: Prisma.TransactionClient): Promise<void> {
        const client = tx ?? this.database;

        await client.passwordResetToken.update({
            where: {
                id,
            },
            data: {
                usedAt: new Date(),
            },
        });
    }
}
