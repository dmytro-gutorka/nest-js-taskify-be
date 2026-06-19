import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import type { CacheEncConfig } from './cache-enc.config.js';

@Injectable()
export class CacheService implements OnModuleDestroy {
    private readonly logger = new Logger(CacheService.name);
    private readonly redis: Redis;
    private readonly config: CacheEncConfig;

    constructor(private readonly configService: ConfigService) {
        this.config = this.configService.getOrThrow<CacheEncConfig>('cache');

        this.redis = new Redis({
            host: this.config.redisHost,
            port: this.config.redisPort,
            lazyConnect: true,
        });

        this.redis.on('error', (err) => {
            this.logger.error('Redis cache connection error', err);
        });
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const raw = await this.redis.get(key);

            if (!raw) return null;

            return JSON.parse(raw) as T;
        } catch (err) {
            this.logger.warn(`Cache GET failed for key "${key}"`, err);

            return null;
        }
    }

    async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
        try {
            await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        } catch (err) {
            this.logger.warn(`Cache SET failed for key "${key}"`, err);
        }
    }

    async del(key: string): Promise<void> {
        try {
            await this.redis.del(key);
        } catch (err) {
            this.logger.warn(`Cache DEL failed for key "${key}"`, err);
        }
    }

    onModuleDestroy() {
        this.redis.disconnect();
    }
}
