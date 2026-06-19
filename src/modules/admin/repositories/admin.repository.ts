import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@database';
import { RoleName } from '../../../infrastructure/database/prisma/generated/enums.js';
import type { AdminUsersQueryDto } from '../dto/admin-users-query.dto.js';
import { SortOrder } from '../../../common/enums/sort-order.enum.js';

@Injectable()
export class AdminRepository {
    constructor(private readonly database: DatabaseService) {}

    async findUsers(query: AdminUsersQueryDto) {
        const { page, limit, search } = query;
        const skip = (page - 1) * limit;

        const where = search
            ? {
                  OR: [
                      { email: { contains: search, mode: 'insensitive' as const } },
                      { name: { contains: search, mode: 'insensitive' as const } },
                      { surname: { contains: search, mode: 'insensitive' as const } },
                  ],
              }
            : {};

        const [items, total] = await this.database.$transaction([
            this.database.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: SortOrder.DESC },
                include: {
                    roles: {
                        include: { role: true },
                    },
                },
            }),
            this.database.user.count({ where }),
        ]);

        return { items, total };
    }

    async findUserById(id: number) {
        return this.database.user.findUnique({
            where: { id },
            include: {
                roles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: {
                                    include: { permission: true },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    async findAllRoles() {
        return this.database.role.findMany({
            include: {
                rolePermissions: {
                    include: { permission: true },
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

    async setUserRoles(userId: number, roleNames: RoleName[]): Promise<void> {
        const roles = await this.database.role.findMany({
            where: { name: { in: roleNames } },
        });

        await this.database.$transaction([
            this.database.userRole.deleteMany({ where: { userId } }),
            this.database.userRole.createMany({
                data: roles.map((role) => ({ userId, roleId: role.id })),
            }),
        ]);
    }
}
