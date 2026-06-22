import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
    PrismaClient,
    RoleName,
    PermissionAction,
    PermissionResource,
} from './generated/client.js';
import { RbacResourceValue, RbacActionValue } from '../../../modules/rbac/index.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

const ROLE_PERMISSIONS = {
    [RoleName.USER]: [
        { resource: PermissionResource.TASKS, action: PermissionAction.CREATE },
        { resource: PermissionResource.TASKS, action: PermissionAction.READ },
        { resource: PermissionResource.TASKS, action: PermissionAction.UPDATE },
        { resource: PermissionResource.TASKS, action: PermissionAction.DELETE },

        { resource: PermissionResource.USERS, action: PermissionAction.CREATE },
        { resource: PermissionResource.USERS, action: PermissionAction.READ },
        { resource: PermissionResource.USERS, action: PermissionAction.UPDATE },
        { resource: PermissionResource.USERS, action: PermissionAction.DELETE },

        { resource: PermissionResource.RBAC, action: PermissionAction.CREATE },
        { resource: PermissionResource.RBAC, action: PermissionAction.READ },
        { resource: PermissionResource.RBAC, action: PermissionAction.UPDATE },
        { resource: PermissionResource.RBAC, action: PermissionAction.DELETE },

    ],
    [RoleName.ADMIN]: [
        { resource: PermissionResource.TASKS, action: PermissionAction.CREATE },
        { resource: PermissionResource.TASKS, action: PermissionAction.READ },
        { resource: PermissionResource.TASKS, action: PermissionAction.UPDATE },
        { resource: PermissionResource.TASKS, action: PermissionAction.DELETE },

        { resource: PermissionResource.USERS, action: PermissionAction.CREATE },
        { resource: PermissionResource.USERS, action: PermissionAction.READ },
        { resource: PermissionResource.USERS, action: PermissionAction.UPDATE },
        { resource: PermissionResource.USERS, action: PermissionAction.DELETE },

        { resource: PermissionResource.RBAC, action: PermissionAction.CREATE },
        { resource: PermissionResource.RBAC, action: PermissionAction.READ },
        { resource: PermissionResource.RBAC, action: PermissionAction.UPDATE },
        { resource: PermissionResource.RBAC, action: PermissionAction.DELETE },
    ],
    [RoleName.GUEST]: [],
} satisfies Record<RoleName, { resource: RbacResourceValue; action: RbacActionValue }[]>;

async function main() {
    await prisma.$transaction(async (tx) => {
        for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
            const role = await tx.role.upsert({
                where: { name: roleName as RoleName },
                update: {},
                create: { name: roleName as RoleName, description: `${roleName} role` },
            });

            const desiredPermissionIds: number[] = [];

            for (const { resource, action } of permissions) {
                const key = `${resource}:${action}`;

                const permission = await tx.permission.upsert({
                    where: { key },
                    update: {},
                    create: { resource, action, key },
                });

                desiredPermissionIds.push(permission.id);

                await tx.rolePermission.upsert({
                    where: {
                        uq_roles_permissions_role_permission: {
                            roleId: role.id,
                            permissionId: permission.id,
                        },
                    },
                    update: {},
                    create: { roleId: role.id, permissionId: permission.id },
                });

                await tx.rolePermission.deleteMany({
                    where: {
                        roleId: role.id,
                        permissionId: {
                            notIn: desiredPermissionIds,
                        },
                    },
                });
            }
        }
    });

    console.log('Seed completed');
}

main()
    .catch((error) => {
        console.error('An error occurred during seeding: ', error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
