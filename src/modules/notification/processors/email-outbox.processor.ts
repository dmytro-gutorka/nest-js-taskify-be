import { EmailOutboxJobPayload } from '../notification.types.js';
import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { EMAIL_OUTBOX_QUEUE } from '../constants/email-outbox-queue.constants.js';
import { EmailOutboxService } from '../services/email-outbox.service.js';
import { EmailProviderService } from '../services/email-provider.service.js';
import { Job } from 'bullmq';

@Injectable()
@Processor(EMAIL_OUTBOX_QUEUE)
export class EmailOutboxProcessor extends WorkerHost {
    private readonly logger = new Logger(EmailOutboxProcessor.name);

    constructor(
        private readonly emailOutboxService: EmailOutboxService,
        private readonly emailProviderService: EmailProviderService,
    ) {
        super();
    }

    async process(job: Job<EmailOutboxJobPayload>): Promise<void> {
        const { emailOutboxId } = job.data;

        const emailOutbox = await this.emailOutboxService.findOneById(emailOutboxId);

        if (!emailOutbox) {
            this.logger.warn(`Email outbox item ${emailOutboxId} not found`);
            return;
        }

        if (emailOutbox.sentAt) {
            this.logger.log(`Email outbox item ${emailOutboxId} already sent`);
            return;
        }

        await this.emailOutboxService.markProcessing(emailOutbox.id);

        try {
            const result = await this.emailProviderService.send({
                to: emailOutbox.recipientEmail,
                subject: emailOutbox.subject,
                html: emailOutbox.htmlBody,
                text: emailOutbox.textBody,
            });

            await this.emailOutboxService.markSent(emailOutbox.id, result.providerMessageId);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown email error';

            await this.emailOutboxService.markFailed(emailOutbox.id, errorMessage);

            this.logger.error(
                `Failed to send email outbox item ${emailOutbox.id}: ${errorMessage}`,
            );

            throw error;
        }
    }
}
