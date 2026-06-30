import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '../../infrastructure/cache/index.js';
import { RbacService } from './services/rbac.service.js';
import { RbacCacheService } from './services/rbac-cache.service.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { RbacRepository } from './repositories/rbac.repository.js';
import { RbacController } from './rbac.controller.js';
import { rbacCacheConfig } from './configs/rbac-cache.config.js';

@Module({
    imports: [DatabaseModule, CacheModule, ConfigModule, ConfigModule.forFeature(rbacCacheConfig)],
    controllers: [RbacController],
    providers: [
        RbacRepository,
        RbacService,
        RbacCacheService,
        PermissionsGuard,
        {
            provide: APP_GUARD,
            useExisting: PermissionsGuard,
        },
    ],
    exports: [RbacService, RbacCacheService, PermissionsGuard],
})
export class RbacModule {}
