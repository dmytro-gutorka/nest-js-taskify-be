import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../infrastructure/database/index.js';
import { RoleName } from '../../../infrastructure/database/prisma/generated/enums.js';

@Injectable()
export class RbacService {
    constructor(private readonly database: DatabaseService) {
    }

    async getUserPermissionKeys(userId: number): Promise<Set<string>> {
        const userRoles = await this.database.userRole.findMany({
            where: {userId},
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: {
                                permission: true
                            },
                        },
                    },
                },
            },
        });

        const allowedUserRoled = userRoles.flatMap((userRole) =>
            userRole.role.rolePermissions.map((rp) => rp.permission.key),
        );

        return new Set(allowedUserRoled);
    }

    async assignRoleToUser(userId: number, roleName: RoleName, tx?): Promise<void> {
        const client = tx ?? this.database;
        const role = await client.role.findUniqueOrThrow({ where: { name: roleName } });

        await client.userRole.upsert({
            where: { uq_users_roles_user_role: { userId, roleId: role.id } },
            update: {},
            create: { userId, roleId: role.id },
        });
    }
}
