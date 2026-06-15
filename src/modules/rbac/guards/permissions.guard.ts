import {
    Injectable,
    ForbiddenException,
    type CanActivate,
    type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { RbacService } from '../services/rbac.service.js';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/required-permissions.decorator.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly rbacService: RbacService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
            REQUIRED_PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredPermissions || requiredPermissions.length === 0) return true;

        const req = context.switchToHttp().getRequest<Request>();
        const userId = req.user?.id;

        const userPermissions = await this.rbacService.getUserPermissionKeys(userId);

        const hasAllNecessaryPermissions = requiredPermissions.every((permission) => userPermissions.has(permission));

        if (!hasAllNecessaryPermissions) throw new ForbiddenException('Insufficient permissions');

        return true;
    }
}
