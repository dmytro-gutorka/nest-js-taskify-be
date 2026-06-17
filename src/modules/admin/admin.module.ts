import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database';
import { RbacModule } from '../rbac/index.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './services/admin.service.js';
import { AdminRepository } from './repositories/admin.repository.js';
import { AdminRoleGuard } from './guards/admin-role.guard.js';

@Module({
    imports: [DatabaseModule, RbacModule],
    controllers: [AdminController],
    providers: [AdminService, AdminRepository, AdminRoleGuard],
})
export class AdminModule {}
