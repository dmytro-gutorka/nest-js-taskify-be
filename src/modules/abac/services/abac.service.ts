import { RbacService } from '../../rbac/services/rbac.service.js';
import { Injectable, ForbiddenException } from '@nestjs/common';
import { AbacTaskAccessService } from './abac-task-access.service.js';
import { ActiveUser } from '../../../common/types/common.types.js';
import { PermissionKey } from '../../rbac/index.js';
import { Prisma } from '@database/client';

@Injectable()
export class AbacService {
    constructor(
        private readonly rbacService: RbacService,
        private readonly abacTaskAccessService: AbacTaskAccessService,
    ) {}

    async buildTaskWhereOrThrow(
        user: ActiveUser,
        permissionKey: PermissionKey,
    ): Promise<Prisma.TaskWhereInput> {
        const rolePermissions = await this.rbacService.getUserRolePermissionsWithRulesByPermission(
            user.id,
            permissionKey,
        );

        const where = this.abacTaskAccessService.buildWhere({
            user,
            permissionKey,
            rolePermissions,
        });

        if (!where) throw new ForbiddenException('Insufficient permissions');

        return where;
    }
}
