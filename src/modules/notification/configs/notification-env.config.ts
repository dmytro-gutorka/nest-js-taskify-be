import {registerAs} from '@nestjs/config';
import {z} from 'zod';

const DEFAULT_EMAIL_OUTBOX_MAX_ATTEMPTS = 3
const DEFAULT_EMAIL_OUTBOX_BACKOFF_MS = 5000;
const DEFAULT_EMAIL_OUTBOX_QUEUE_NAME = 'email-outbox';

const NotificationEnvSchema = z.object({
    REDIS_HOST: z.string().min(1),
    REDIS_PORT: z.coerce.number().int().positive(),

    RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
    RESEND_FROM_EMAIL: z.string().min(1, 'RESEND_FROM_EMAIL is required'),

    EMAIL_OUTBOX_QUEUE_NAME: z.string().min(1).default(DEFAULT_EMAIL_OUTBOX_QUEUE_NAME),
    EMAIL_OUTBOX_MAX_ATTEMPTS: z.coerce.number().int().positive().default(DEFAULT_EMAIL_OUTBOX_MAX_ATTEMPTS),
    EMAIL_OUTBOX_BACKOFF_MS: z.coerce.number().int().positive().default(DEFAULT_EMAIL_OUTBOX_BACKOFF_MS),
});

export const notificationEnvConfig = registerAs('notification', () => {
    const env = NotificationEnvSchema.parse(process.env);

    return {
        redisHost: env.REDIS_HOST,
        redisPort: env.REDIS_PORT,

        resendApiKey: env.RESEND_API_KEY,
        resendFromEmail: env.RESEND_FROM_EMAIL,

        emailOutboxQueueName: env.EMAIL_OUTBOX_QUEUE_NAME,
        emailOutboxMaxAttempts: env.EMAIL_OUTBOX_MAX_ATTEMPTS,
        emailOutboxBackoffMs: env.EMAIL_OUTBOX_BACKOFF_MS,
    };
});