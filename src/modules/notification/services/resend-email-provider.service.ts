import { Inject, Injectable } from '@nestjs/common';
import { EmailProviderService } from './email-provider.service.js';
import { Resend } from 'resend';
import { type ConfigType } from '@nestjs/config';
import { SendEmailInput, SendEmailResult } from '../notification.types.js';
import { notificationEnvConfig } from '../configs/notification-env.config.js';

@Injectable()
export class ResendEmailProviderService extends EmailProviderService {
    private readonly resend: Resend;

    constructor(
        @Inject(notificationEnvConfig.KEY)
        private readonly config: ConfigType<typeof notificationEnvConfig>,
    ) {
        super();

        this.resend = new Resend(this.config.resendApiKey);
    }

    async send(input: SendEmailInput): Promise<SendEmailResult> {
        const { data, error } = await this.resend.emails.send({
            from: this.config.resendFromEmail,
            to: input.to,
            subject: input.subject,
            html: input.html,
            text: input.text ?? undefined,
        });

        if (error) throw new Error(error.message);

        if (!data?.id) throw new Error('Email provider did not return message id');

        return {
            providerMessageId: data.id,
        };
    }
}
