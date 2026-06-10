import { Injectable, Inject } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { hash, compare } from 'bcrypt';
import { authZodConfig } from '../configs/auth-zod.config.js';

@Injectable()
export class CryptoService {
    constructor(
        @Inject(authZodConfig.KEY)
        private readonly config: ConfigType<typeof authZodConfig>,
    ) {}

    async hash(password: string): Promise<string> {
        const saltRounds = this.config.saltRounds;

        return hash(password, saltRounds);
    }

    async compare(raw: string, hashed: string): Promise<boolean> {
        return compare(raw, hashed);
    }
}
