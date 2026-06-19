import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@database';
import { RoleName } from '../../../infrastructure/database/prisma/generated/enums.js';
import { SortOrder } from '../../../common/enums/sort-order.enum.js';
import { PermissionKey } from '../rbac.types.js';
import { Prisma } from '@database/client';

@Injectable()
export class RbacRepository {
    constructor(private readonly database: DatabaseService) {}

    async getUserPermissionKeys(userId: number): Promise<PermissionKey[]> {
        const userRoles = await this.database.userRole.findMany({
            where: { userId },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true,
                            },
                        },
                    },
                },
            },
        });

        const permissionKeys = userRoles.flatMap((userRole) =>
            userRole.role.rolePermissions.map(
                (rolePermission) => rolePermission.permission.key as PermissionKey,
            ),
        );

        return [...new Set(permissionKeys)];
    }

    async getUserRoleNamesList(userId: number): Promise<RoleName[]> {
        const userRoles = await this.database.userRole.findMany({
            where: { userId },
            include: { role: true },
            orderBy: { roleId: SortOrder.ASC },
        });

        return userRoles.map((userRole) => userRole.role.name);
    }

    async getRoleNamesByUserIds(userIds: number[]): Promise<Map<number, RoleName[]>> {
        if (userIds.length === 0) return new Map();

        const userRoles = await this.database.userRole.findMany({
            where: {
                userId: { in: userIds },
            },
            include: {
                role: true,
            },
            orderBy: [{ userId: SortOrder.ASC }, { roleId: SortOrder.ASC }],
        });

        const rolesByUserId = new Map<number, RoleName[]>();

        for (const userId of userIds) {
            rolesByUserId.set(userId, []);
        }

        for (const userRole of userRoles) {
            const roles = rolesByUserId.get(userRole.userId) ?? [];

            roles.push(userRole.role.name);
            rolesByUserId.set(userRole.userId, roles);
        }

        return rolesByUserId;
    }

    async findRolesByNames(roleNames: RoleName[]) {
        if (roleNames.length === 0) {
            return [];
        }

        return this.database.role.findMany({
            where: {
                name: {
                    in: roleNames,
                },
            },
        });
    }

    async setUserRolesByRoleIds(userId: number, roleIds: number[]): Promise<void> {
        await this.database.$transaction(async (tx) => {
            await tx.userRole.deleteMany({
                where: { userId },
            });

            if (roleIds.length === 0) {
                return;
            }

            await tx.userRole.createMany({
                data: roleIds.map((roleId) => ({
                    userId,
                    roleId,
                })),
            });
        });
    }

    async findAllRolesWithPermissions() {
        return this.database.role.findMany({
            include: {
                rolePermissions: {
                    include: {
                        permission: true,
                    },
                },
            },
            orderBy: { id: SortOrder.ASC },
        });
    }

    async findAllPermissions() {
        return this.database.permission.findMany({
            orderBy: [{ resource: SortOrder.ASC }, { action: SortOrder.ASC }],
        });
    }

    async findRoleByName(roleName: RoleName, tx?: Prisma.TransactionClient) {
        const client = tx ?? this.database;

        return client.role.findUniqueOrThrow({
            where: { name: roleName },
        });
    }

    async assignRoleToUser(
        userId: number,
        roleId: number,
        tx?: Prisma.TransactionClient,
    ): Promise<void> {
        const client = tx ?? this.database;

        await client.userRole.upsert({
            where: {
                uq_users_roles_user_role: {
                    userId,
                    roleId,
                },
            },
            update: {},
            create: {
                userId,
                roleId,
            },
        });
    }
}
