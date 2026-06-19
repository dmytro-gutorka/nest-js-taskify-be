import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@database/client';
import { RoleName } from '../../../infrastructure/database/prisma/generated/enums.js';
import { RbacCacheService } from './rbac-cache.service.js';
import { RbacRepository } from '../repositories/rbac.repository.js';
import { PermissionKey, RoleWithPermissionsResponse } from '../rbac.types.js';

@Injectable()
export class RbacService {
    constructor(
        private readonly rbacCacheService: RbacCacheService,
        private readonly rbacRepository: RbacRepository,
    ) {}

    async getUserPermissionKeys(userId: number): Promise<PermissionKey[]> {
        const cachedPermissionKeys = await this.rbacCacheService.getUserPermissionKeys(userId);

        if (cachedPermissionKeys) {
            return cachedPermissionKeys;
        }

        const permissionKeys = await this.rbacRepository.getUserPermissionKeys(userId);

        await this.rbacCacheService.setUserPermissionKeys(userId, permissionKeys);

        return permissionKeys;
    }

    async getUserRoleNamesList(userId: number): Promise<RoleName[]> {
        const cachedRoleNames = await this.rbacCacheService.getUserRoleNames(userId);

        if (cachedRoleNames) {
            return cachedRoleNames;
        }

        const roleNames = await this.rbacRepository.getUserRoleNamesList(userId);

        await this.rbacCacheService.setUserRoleNames(userId, roleNames);

        return roleNames;
    }

    async getRoleNamesByUserIds(userIds: number[]): Promise<Map<number, RoleName[]>> {
        return this.rbacRepository.getRoleNamesByUserIds(userIds);
    }

    async setUserRoles(userId: number, roleNames: RoleName[]): Promise<void> {
        const uniqueRoleNames = [...new Set(roleNames)];

        const roles = await this.rbacRepository.findRolesByNames(uniqueRoleNames);

        if (roles.length !== uniqueRoleNames.length) {
            throw new BadRequestException('One or more roles do not exist');
        }

        await this.rbacRepository.setUserRolesByRoleIds(
            userId,
            roles.map((role) => role.id),
        );

        await this.rbacCacheService.invalidateUserAccess(userId);
    }

    async assignRoleToUser(
        userId: number,
        roleName: RoleName,
        tx?: Prisma.TransactionClient,
    ): Promise<void> {
        const role = await this.rbacRepository.findRoleByName(roleName, tx);

        await this.rbacRepository.assignRoleToUser(userId, role.id, tx);
        await this.rbacCacheService.invalidateUserAccess(userId);
    }

    async findAllRolesWithPermissions(): Promise<RoleWithPermissionsResponse[]> {
        const roles = await this.rbacRepository.findAllRolesWithPermissions();

        return roles.map((role) => ({
            id: role.id,
            name: role.name,
            description: role.description,
            permissions: role.rolePermissions.map((rolePermission) => ({
                id: rolePermission.permission.id,
                resource: rolePermission.permission.resource,
                action: rolePermission.permission.action,
                key: rolePermission.permission.key as PermissionKey,
                description: rolePermission.permission.description,
            })),
        }));
    }

    async findAllPermissions() {
        return this.rbacRepository.findAllPermissions();
    }
}
