import { EmailOutbox, EmailOutboxStatus } from '@database/client';
import { EmailProvider } from './enums/email-provider.enum.js';
import { Prisma } from '@database/client';
import { Nullable } from '../../common/types/common.types.js';

export type EmailOutboxEntity = EmailOutbox;

export interface CreateEmailOutboxInput {
    recipientEmail: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    provider?: EmailProvider;
    tx?: Prisma.TransactionClient;
}

export interface UpdateEmailOutboxInput {
    status?: EmailOutboxStatus;
    providerMessageId?: Nullable<string>;
    queuedAt?: Nullable<Date>;
    processingAt?: Nullable<Date>;
    sentAt?: Nullable<Date>;
    failedAt?: Nullable<Date>;
    lastError?: Nullable<string>;
}

export interface EmailOutboxJobPayload {
    emailOutboxId: number;
}

export interface SendEmailResult {
    providerMessageId: string;
}

export interface SendEmailInput {
    to: string;
    subject: string;
    html: string;
    text?: string | null;
}
