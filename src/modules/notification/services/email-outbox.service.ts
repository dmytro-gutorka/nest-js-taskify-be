import {EmailOutboxRepository} from "../repositories/email-outbox.repository.js";
import {Injectable} from "@nestjs/common";
import {CreateEmailOutboxInput, EmailOutboxEntity, UpdateEmailOutboxInput} from "../notification.types.js";
import {Prisma, EmailOutboxStatus} from '@database/client'

@Injectable()
export class EmailOutboxService {
    constructor(private readonly emailOutboxRepository: EmailOutboxRepository) {
    }

    enqueue(input: CreateEmailOutboxInput): Promise<EmailOutboxEntity> {
        return this.emailOutboxRepository.create(input);
    }

    findOneById(
        id: number,
        tx?: Prisma.TransactionClient,
    ): Promise<EmailOutboxEntity | null> {
        return this.emailOutboxRepository.findOneById(id, tx);
    }

    async update(
        id: number,
        input: UpdateEmailOutboxInput,
        tx?: Prisma.TransactionClient,
    ): Promise<void> {
        await this.emailOutboxRepository.update(id, input, tx);
    }

    async markQueued(id: number, tx?: Prisma.TransactionClient): Promise<void> {
        await this.update(
            id,
            {
                status: EmailOutboxStatus.QUEUED,
                queuedAt: new Date(),
                lastError: null,
            },
            tx,
        );
    }

    async markProcessing(id: number, tx?: Prisma.TransactionClient): Promise<void> {
        await this.update(
            id,
            {
                status: EmailOutboxStatus.PROCESSING,
                processingAt: new Date(),
            },
            tx,
        );
    }

    async markSent(
        id: number,
        providerMessageId: string,
        tx?: Prisma.TransactionClient,
    ): Promise<void> {
        await this.update(
            id,
            {
                status: EmailOutboxStatus.SENT,
                providerMessageId,
                sentAt: new Date(),
                failedAt: null,
                lastError: null,
            },
            tx,
        );
    }

    async markFailed(
        id: number,
        errorMessage: string,
        tx?: Prisma.TransactionClient,
    ): Promise<void> {
        await this.update(
            id,
            {
                status: EmailOutboxStatus.FAILED,
                failedAt: new Date(),
                lastError: errorMessage,
            },
            tx,
        );
    }

    async markStuckProcessingAsFailed(
        processingBefore: Date,
        tx?: Prisma.TransactionClient,
    ): Promise<number> {
        return this.emailOutboxRepository.markStuckProcessingAsFailed(
            processingBefore,
            tx,
        );
    }

    async deleteFinalizedOlderThan(
        olderThan: Date,
        tx?: Prisma.TransactionClient,
    ): Promise<number> {
        return this.emailOutboxRepository.deleteFinalizedOlderThan(olderThan, tx);
    }

    findManyForEnqueue(
        failedBefore: Date,
        limit: number,
        tx?: Prisma.TransactionClient,
    ): Promise<EmailOutboxEntity[]> {
        return this.emailOutboxRepository.findManyForEnqueue(
            failedBefore,
            limit,
            tx,
        );
    }
}