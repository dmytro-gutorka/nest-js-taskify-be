import {EmailOutboxEntity, CreateEmailOutboxInput, UpdateEmailOutboxInput} from "../notification.types.js";
import {Injectable} from "@nestjs/common";
import {EmailOutboxStatus} from '@database/enums'
import {DatabaseService} from "../../../infrastructure/database/index.js";
import {Prisma} from '@database/client';
import {EmailProvider} from "../enums/email-provider.enum.js";

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
    ): Promise<void> {
        const client = tx ?? this.database;

        await client.emailOutbox.deleteMany({
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
    }
}