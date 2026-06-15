import {Injectable} from '@nestjs/common';
import {DatabaseService} from '../../../infrastructure/database/index.js';

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
}
