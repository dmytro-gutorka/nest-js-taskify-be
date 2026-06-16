import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database';
import { APP_GUARD } from '@nestjs/core';
import { RbacService } from './services/rbac.service.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { RbacRepository } from './repositories/rbac.repository.js';

@Module({
    imports: [DatabaseModule],
    providers: [
        RbacService,
        RbacRepository,
        PermissionsGuard,
        {
            provide: APP_GUARD,
            useExisting: PermissionsGuard,
        },
    ],
    exports: [RbacService, PermissionsGuard],
})
export class RbacModule {}
