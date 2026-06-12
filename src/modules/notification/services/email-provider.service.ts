import { SendEmailInput, SendEmailResult } from '../notification.types.js';

export abstract class EmailProviderService {
    abstract send(input: SendEmailInput): Promise<SendEmailResult>;
}
