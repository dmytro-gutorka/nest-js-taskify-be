import { EmailOutboxRepository } from './repositories/email-outbox.repository.js';
import { Module } from '@nestjs/common';
import { EmailOutboxService } from './services/email-outbox.service.js';
import { ResendEmailProviderService } from './services/resend-email-provider.service.js';
import { ConfigModule } from '@nestjs/config';
import { EmailProviderService } from './services/email-provider.service.js';
import { EmailOutboxQueueService } from './services/email-outbox-queue.service.js';
import { EmailOutboxProcessor } from './processors/email-outbox.processor.js';
import { EMAIL_OUTBOX_QUEUE } from './constants/email-outbox-queue.constants.js';
import { BullModule } from '@nestjs/bullmq';
import { notificationEnvConfig } from './configs/notification-env.config.js';
import { NotificationMaintenanceService } from './services/notification-maintenance.service.js';

@Module({
    imports: [
        ConfigModule.forFeature(notificationEnvConfig),
        BullModule.registerQueue({
            // @gutnidev у тебя в "src/modules/notification/configs/notification-env.config.ts" парсится зачем-то эта переменная. Или убери из .env, или тут используй из .env.
            name: EMAIL_OUTBOX_QUEUE,
        }),
    ],
    providers: [
        EmailOutboxRepository,
        EmailOutboxService,
        EmailOutboxQueueService,

        ResendEmailProviderService,
        {
            provide: EmailProviderService,
            useExisting: ResendEmailProviderService,
        },

        EmailOutboxProcessor,
        NotificationMaintenanceService,
    ],
    exports: [EmailOutboxService, EmailOutboxQueueService],
})
export class NotificationModule {}
