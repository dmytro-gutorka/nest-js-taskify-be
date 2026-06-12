import { authEnvConfig } from '../../auth/configs/auth-env.config.js';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { PasswordResetTokenRepository } from '../../auth/repositories/password-reset-token.repository.js';
import { type ConfigType } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { dateBeforeNow } from '../../../common/utils/time.utils.js';

@Injectable()
export class PasswordResetMaintenanceService {
    private readonly logger = new Logger(PasswordResetMaintenanceService.name);

    constructor(
        private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
        @Inject(authEnvConfig.KEY)
        private readonly config: ConfigType<typeof authEnvConfig>,
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_1PM)
    async cleanupInactivePasswordResetTokens(): Promise<void> {
        const olderThan = dateBeforeNow.days(this.config.passwordResetTokenCleanupDays);

        const deletedCount =
            await this.passwordResetTokenRepository.deleteInactiveOlderThan(olderThan);

        if (deletedCount > 0)
            this.logger.log(`Deleted ${deletedCount} inactive password reset tokens`);
    }
}
