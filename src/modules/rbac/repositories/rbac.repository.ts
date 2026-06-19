import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@database';
import { Prisma } from '@database/client';
import { RoleName } from '../../../infrastructure/database/prisma/generated/enums.js';

@Injectable()
export class RbacRepository {
    constructor(private readonly database: DatabaseService) {}

    async getUserRolesWithPermissions(userId: number) {
        return this.database.userRole.findMany({
            where: { userId },
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: { permission: true },
                        },
                    },
                },
            },
        });
    }

    async findRoleByName(roleName: RoleName, tx?: Prisma.TransactionClient) {
        const client = tx ?? this.database;
        return client.role.findUniqueOrThrow({ where: { name: roleName } });
    }

    async getUserRoleNames(userId: number): Promise<Set<RoleName>> {
        const userRoles = await this.database.userRole.findMany({
            where: { userId },
            include: { role: true },
        });
        return new Set(userRoles.map((ur) => ur.role.name));
    }

    async assignRoleToUser(userId: number, roleId: number, tx?: Prisma.TransactionClient) {
        const client = tx ?? this.database;
        return client.userRole.upsert({
            where: { uq_users_roles_user_role: { userId, roleId } },
            update: {},
            create: { userId, roleId },
        });
    }
}
