import { Controller, Get } from '@nestjs/common';
import { RbacService } from './services/rbac.service.js';
import { RequiredPermissions } from './decorators/required-permissions.decorator.js';

@Controller('rbac')
export class RbacController {
    constructor(private readonly rbacService: RbacService) {}

    @Get('roles')
    @RequiredPermissions('USERS:READ')
    findAllRoles() {
        return this.rbacService.findAllRolesWithPermissions();
    }

    @Get('permissions')
    @RequiredPermissions('USERS:READ')
    findAllPermissions() {
        return this.rbacService.findAllPermissions();
    }
}
