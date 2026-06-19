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
import { SKIP_PERMISSIONS_KEY } from '../decorators/skip-permissions.decorator.js';
import { SKIP_ACCESS_TOKEN_GUARD_KEY } from '../../../common/decorators/skip-access-token.decorator.js';
import { PermissionKey } from '../rbac.types.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly rbacService: RbacService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const targets = [context.getHandler(), context.getClass()];

        const isPublic = this.reflector.getAllAndOverride<boolean>(
            SKIP_ACCESS_TOKEN_GUARD_KEY,
            targets,
        );
        if (isPublic) return true;

        const skipPermissions = this.reflector.getAllAndOverride<boolean>(
            SKIP_PERMISSIONS_KEY,
            targets,
        );
        if (skipPermissions) return true;

        const requiredPermissions =
            this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS_KEY, targets) ?? [];

        if (!requiredPermissions.length || requiredPermissions.length === 0) {
            throw new Error(
                'Array of @RequiredPermissions  must be filled with permissions or use @SkipPermissions decorator instead if no permissions are required',
            );
        }

        const request = context.switchToHttp().getRequest<Request>();

        if (!request.user?.id) throw new ForbiddenException('User is not authenticated');

        const userPermissions = await this.rbacService.getUserPermissionKeys(request.user?.id);
        const hasAllNecessaryPermissions = requiredPermissions.every((permission: PermissionKey) =>
            userPermissions.includes(permission),
        );

        if (!hasAllNecessaryPermissions) throw new ForbiddenException('Insufficient permissions');

        return true;
    }
}
