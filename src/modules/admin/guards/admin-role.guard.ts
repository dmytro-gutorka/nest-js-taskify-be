import {
    Injectable,
    ForbiddenException,
    type CanActivate,
    type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import { RoleName } from '../../../infrastructure/database/prisma/generated/enums.js';
import { RbacService } from '../../rbac/services/rbac.service.js';

@Injectable()
export class AdminRoleGuard implements CanActivate {
    constructor(private readonly rbacService: RbacService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const userId = request.user?.id;

        const userRoles = await this.rbacService.getUserRoleNames(userId);

        if (!userRoles.has(RoleName.ADMIN)) {
            throw new ForbiddenException('Admin access required');
        }

        return true;
    }
}
