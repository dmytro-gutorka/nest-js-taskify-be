import { Injectable, Inject } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { hash, compare } from 'bcrypt';
import { authEnvConfig } from '../configs/auth-env.config.js';

@Injectable()
export class CryptoService {
    constructor(
        @Inject(authEnvConfig.KEY)
        private readonly config: ConfigType<typeof authEnvConfig>,
    ) {}

    async hash(password: string): Promise<string> {
        const saltRounds = this.config.saltRounds;

        return hash(password, saltRounds);
    }

    async compare(raw: string, hashed: string): Promise<boolean> {
        return compare(raw, hashed);
    }
}
