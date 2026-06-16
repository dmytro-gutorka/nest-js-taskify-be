import { Injectable } from '@nestjs/common';
import { Prisma } from '@database/client';
import { RoleName } from '../../../infrastructure/database/prisma/generated/enums.js';
import { RbacRepository } from '../repositories/rbac.repository.js';

@Injectable()
export class RbacService {
    constructor(private readonly rbacRepository: RbacRepository) {}

    async getUserPermissionKeys(userId: number): Promise<Set<string>> {
        const userRoles = await this.rbacRepository.getUserRolesWithPermissions(userId);

        const keys = userRoles.flatMap((userRole) =>
            userRole.role.rolePermissions.map((rolePermission) => rolePermission.permission.key),
        );

        return new Set(keys);
    }

    async assignRoleToUser(
        userId: number,
        roleName: RoleName,
        tx?: Prisma.TransactionClient,
    ): Promise<void> {
        const role = await this.rbacRepository.findRoleByName(roleName, tx);
        await this.rbacRepository.assignRoleToUser(userId, role.id, tx);
    }
}
