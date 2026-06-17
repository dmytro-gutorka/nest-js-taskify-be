import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from './cache.service.js';
import { cacheConfig } from './cache.config.js';

@Module({
    imports: [ConfigModule.forFeature(cacheConfig)],
    providers: [CacheService],
    exports: [CacheService],
})
export class CacheModule {}
