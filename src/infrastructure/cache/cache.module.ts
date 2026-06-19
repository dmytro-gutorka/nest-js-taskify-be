import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from './cache.service.js';
import { cacheEnvConfig } from './cache.config.js';

@Module({
    imports: [ConfigModule.forFeature(cacheEnvConfig)],
    providers: [CacheService],
    exports: [CacheService, ConfigModule],
})
export class CacheModule {}
