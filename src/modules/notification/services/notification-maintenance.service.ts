import {CronExpression, Cron} from "@nestjs/schedule";
import {Injectable, Logger, Inject} from "@nestjs/common";
import {EmailOutboxService} from "./email-outbox.service.js";
import {EmailOutboxQueueService} from "./email-outbox-queue.service.js";
import {type ConfigType} from "@nestjs/config";
import {notificationEnvConfig} from "../configs/notification-env.config.js";
import {milliseconds, dateBeforeNow} from "../../../common/utils/time.utils.js";

@Injectable()
export class NotificationMaintenanceService {
    private readonly logger = new Logger(NotificationMaintenanceService.name);

    constructor(
        private readonly emailOutboxService: EmailOutboxService,
        private readonly emailOutboxQueueService: EmailOutboxQueueService,
        @Inject(notificationEnvConfig.KEY)
        private readonly config: ConfigType<typeof notificationEnvConfig>,
    ) {
    }

    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async cleanupFinalizedEmailOutbox(): Promise<void> {
        const olderThan = dateBeforeNow.days(this.config.emailOutboxCleanupDays)

        const deletedCount =
            await this.emailOutboxService.deleteFinalizedOlderThan(olderThan);

        if (deletedCount > 0) {
            this.logger.log(
                `Deleted ${deletedCount} finalized email outbox records`,
            );
        }
    }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async recoverStuckProcessingEmails(): Promise<void> {
        const processingBefore = dateBeforeNow.minutes(this.config.emailOutboxStuckProcessingMinutes)

        const recoveredCount =
            await this.emailOutboxService.markStuckProcessingAsFailed(
                processingBefore,
            );

        if (recoveredCount > 0) {
            this.logger.warn(
                `Recovered ${recoveredCount} stuck processing email outbox records`,
            );
        }
    }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async enqueuePendingAndFailedEmails(): Promise<void> {
        const failedBefore = dateBeforeNow.minutes(this.config.emailOutboxEnqueueFailedAfterMinutes)

        const emails = await this.emailOutboxService.findManyForEnqueue(
            failedBefore,
            this.config.emailOutboxMaxAttempts,
        );

        for (const email of emails) {
            await this.emailOutboxService.markQueued(email.id);
            await this.emailOutboxQueueService.enqueueEmailOutbox(email.id);
        }

        if (emails.length > 0) {
            this.logger.log(
                `Re-enqueued ${emails.length} email outbox records`,
            );
        }
    }
}