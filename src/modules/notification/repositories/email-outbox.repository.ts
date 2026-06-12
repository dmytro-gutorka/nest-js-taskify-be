import {EmailOutboxEntity, CreateEmailOutboxInput, UpdateEmailOutboxInput} from "../notification.types.js";
import {Injectable} from "@nestjs/common";
import {EmailOutboxStatus} from '@database/enums'
import {DatabaseService} from "../../../infrastructure/database/index.js";
import {Prisma} from '@database/client';
import {EmailProvider} from "../enums/email-provider.enum.js";
import {SortOrder} from "../../../common/index.js";

@Injectable()
export class EmailOutboxRepository {
    constructor(private readonly database: DatabaseService) {
    }

    findOneById(
        id: number,
        tx?: Prisma.TransactionClient,
    ): Promise<EmailOutboxEntity | null> {
        const client = tx ?? this.database;

        return client.emailOutbox.findUnique({
            where: {id},
        });
    }

    create(input: CreateEmailOutboxInput): Promise<EmailOutboxEntity> {
        const client = input.tx ?? this.database;

        return client.emailOutbox.create({
            data: {
                recipientEmail: input.recipientEmail,
                subject: input.subject,
                htmlBody: input.htmlBody,
                textBody: input.textBody ?? null,
                status: EmailOutboxStatus.PENDING,
                provider: input.provider ?? EmailProvider.RESEND,
            },
        });
    }

    async update(
        id: number,
        input: UpdateEmailOutboxInput,
        tx?: Prisma.TransactionClient,
    ): Promise<void> {
        const client = tx ?? this.database;

        await client.emailOutbox.update({
            where: {id},
            data: input,
        });
    }

    async deleteFinalizedOlderThan(
        olderThan: Date,
        tx?: Prisma.TransactionClient,
    ): Promise<number> {
        const client = tx ?? this.database;

        const result = await client.emailOutbox.deleteMany({
            where: {
                status: {
                    in: [
                        EmailOutboxStatus.SENT,
                        EmailOutboxStatus.EXCEEDED_MAX_ATTEMPTS,
                    ],
                },
                updatedAt: {
                    lt: olderThan,
                },
            },
        });

        return result.count;
    }

    async markStuckProcessingAsFailed(
        processingBefore: Date,
        tx?: Prisma.TransactionClient,
    ): Promise<number> {
        const client = tx ?? this.database;

        const result = await client.emailOutbox.updateMany({
            where: {
                status: EmailOutboxStatus.PROCESSING,
                processingAt: {
                    lt: processingBefore,
                },
            },
            data: {
                status: EmailOutboxStatus.FAILED,
                failedAt: new Date(),
                lastError: 'Email processing timeout',
            },
        });

        return result.count;
    }

    findManyForEnqueue(
        failedBefore: Date,
        limit: number,
        tx?: Prisma.TransactionClient,
    ): Promise<EmailOutboxEntity[]> {
        const client = tx ?? this.database;

        return client.emailOutbox.findMany({
            where: {
                OR: [
                    {
                        status: EmailOutboxStatus.PENDING,
                    },
                    {
                        status: EmailOutboxStatus.FAILED,
                        failedAt: {
                            lt: failedBefore,
                        },
                    },
                ],
            },
            orderBy: {
                createdAt: SortOrder.ASC,
            },
            take: limit,
        });
    }
}