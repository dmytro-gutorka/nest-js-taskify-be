import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '../../infrastructure/cache/index.js';
import { RbacService } from './services/rbac.service.js';
import { RbacCacheService } from './services/rbac-cache.service.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { RbacRepository } from './repositories/rbac.repository.js';

@Module({
    imports: [DatabaseModule, CacheModule, ConfigModule],
    providers: [
        RbacRepository,
        RbacCacheService,
        RbacService,
        PermissionsGuard,
        {
            provide: APP_GUARD,
            useExisting: PermissionsGuard,
        },
    ],
    exports: [RbacService, PermissionsGuard],
})
export class RbacModule {}
