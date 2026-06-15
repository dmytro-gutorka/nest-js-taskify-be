import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database';
import { RbacService } from './services/rbac.service.js';
import { PermissionsGuard } from './guards/permissions.guard.js';

@Module({
    imports: [DatabaseModule],
    providers: [RbacService, PermissionsGuard],
    exports: [RbacService, PermissionsGuard],
})
export class RbacModule {}
