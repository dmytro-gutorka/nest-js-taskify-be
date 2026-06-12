import {InjectQueue} from "@nestjs/bullmq";
import {Injectable, Inject} from "@nestjs/common";
import {EMAIL_OUTBOX_QUEUE, EMAIL_OUTBOX_SEND_JOB} from "../constants/email-outbox-queue.constants.js";
import {Queue} from "bullmq";
import {EmailOutboxJobPayload} from "../notification.types.js";
import {type ConfigType} from "@nestjs/config";
import {notificationEnvConfig} from "../configs/notification-env.config.js";

@Injectable()
export class EmailOutboxQueueService {
    constructor(
        @InjectQueue(EMAIL_OUTBOX_QUEUE)
        private readonly emailOutboxQueue: Queue<EmailOutboxJobPayload>,
        @Inject(notificationEnvConfig.KEY)
        private readonly config: ConfigType<typeof notificationEnvConfig>,
    ) {
    }

    async enqueueEmailOutbox(emailOutboxId: number): Promise<void> {
        await this.emailOutboxQueue.add(
            EMAIL_OUTBOX_SEND_JOB,
            {
                emailOutboxId,
            },
            {
                attempts: this.config.emailOutboxMaxAttempts,
                backoff: {
                    type: 'exponential',
                    delay: this.config.emailOutboxBackoffMs,
                },
                removeOnComplete: true,
                removeOnFail: false,
            },
        );
    }
}