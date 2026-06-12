import {
    generatePasswordResetToken,
    hashPasswordResetToken,
} from '../helpers/password-reset-token.helpers.js';
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../../infrastructure/database/index.js';
import { AuthService } from './auth.service.js';
import { PasswordResetTokenRepository } from '../repositories/password-reset-token.repository.js';
import { EmailOutboxService } from '../../notification/services/email-outbox.service.js';
import { CryptoService } from './crypto.service.js';
import { authEnvConfig } from '../configs/auth-env.config.js';
import { type ConfigType } from '@nestjs/config';
import {
    buildPasswordResetUrl,
    buildPasswordResetEmailHtml,
    buildPasswordResetEmailText,
} from '../helpers/password-reset-email.helpers.js';
import { EmailOutboxQueueService } from '../../notification/services/email-outbox-queue.service.js';
import { ActiveUser } from '../../../common/types/common.types.js';
import { MessageResponse } from '../../../common/types/responses.types.js';
import { ConfirmPasswordResetDto } from '../dto/confirm-password-reset.dto.js';

@Injectable()
export class PasswordResetService {
    constructor(
        private readonly database: DatabaseService,
        private readonly authService: AuthService,
        private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
        private readonly emailOutboxService: EmailOutboxService,
        private readonly cryptoService: CryptoService,
        private readonly emailOutboxQueueService: EmailOutboxQueueService,
        @Inject(authEnvConfig.KEY)
        private readonly config: ConfigType<typeof authEnvConfig>,
    ) {}

    async requestAuthenticatedPasswordReset(activeUser: ActiveUser): Promise<MessageResponse> {
        const auth = await this.authService.findLocalAuthByUserId(activeUser.id);

        const resetToken = generatePasswordResetToken(this.config.resetPasswordTokenBytes);

        const tokenHash = hashPasswordResetToken(resetToken);

        const expiresAt = new Date(Date.now() + this.config.resetPasswordTokenTtlMs);

        const resetUrl = buildPasswordResetUrl(this.config.frontendUrl, resetToken);

        const emailOutbox = await this.database.$transaction(async (tx) => {
            await this.passwordResetTokenRepository.revokeActiveByUserId(activeUser.id, tx);

            await this.passwordResetTokenRepository.create(
                {
                    userId: activeUser.id,
                    authId: auth.id,
                    tokenHash,
                    expiresAt,
                },
                tx,
            );

            return this.emailOutboxService.enqueue({
                recipientEmail: activeUser.email,
                subject: 'Reset your password',
                htmlBody: buildPasswordResetEmailHtml(resetUrl),
                textBody: buildPasswordResetEmailText(resetUrl),
                tx,
            });
        });

        await this.emailOutboxService.markQueued(emailOutbox.id);
        await this.emailOutboxQueueService.enqueueEmailOutbox(emailOutbox.id);

        return {
            message: 'Password reset link sent',
        };
    }

    async confirmPasswordReset(confirmPasswordResetDto: ConfirmPasswordResetDto): Promise<void> {
        const tokenHash = hashPasswordResetToken(confirmPasswordResetDto.token);

        const passwordResetToken =
            await this.passwordResetTokenRepository.findByTokenHash(tokenHash);

        if (!passwordResetToken) {
            throw new BadRequestException('Reset token is invalid or expired');
        }

        const isTokenUsedOrRevoked = passwordResetToken?.usedAt || passwordResetToken?.revokedAt;
        const isTokenExpired = passwordResetToken.expiresAt.getTime() <= Date.now();

        if (isTokenUsedOrRevoked || isTokenExpired) {
            throw new BadRequestException('Reset token is invalid or expired');
        }

        const hashedPassword = await this.cryptoService.hash(confirmPasswordResetDto.newPassword);

        await this.database.$transaction(async (tx) => {
            await this.authService.updatePassword(passwordResetToken.authId, hashedPassword, tx);

            await this.passwordResetTokenRepository.markUsed(passwordResetToken.id, tx);
        });
    }
}
