import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
    Prisma,
    PrismaClient,
    RoleName,
    PermissionAction,
    PermissionResource,
    RolePermissionRuleEffect,
    RolePermissionRuleType,
} from './generated/client.js';
import { RbacActionValue, RbacResourceValue } from '../../../modules/rbac/index.js';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
});

const prisma = new PrismaClient({ adapter });

type RolePermissionSeed = {
    resource: RbacResourceValue;
    action: RbacActionValue;
};

type RolePermissionRuleSeed = {
    effect: RolePermissionRuleEffect;
    type: RolePermissionRuleType;
    conditions?: Prisma.InputJsonValue | null;
};

const ROLE_PERMISSIONS = {
    [RoleName.USER]: [
        { resource: PermissionResource.TASKS, action: PermissionAction.CREATE },
        { resource: PermissionResource.TASKS, action: PermissionAction.READ },
        { resource: PermissionResource.TASKS, action: PermissionAction.UPDATE },
        { resource: PermissionResource.TASKS, action: PermissionAction.DELETE },
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
} satisfies Record<RoleName, RolePermissionSeed[]>;

function getRolePermissionRuleSeed(
    roleName: RoleName,
    permission: RolePermissionSeed,
): RolePermissionRuleSeed | null {
    if (roleName === RoleName.GUEST) return null;

    if (roleName === RoleName.ADMIN) {
        return {
            effect: RolePermissionRuleEffect.ALLOW,
            type: RolePermissionRuleType.FULL_ACCESS,
            conditions: null,
        };
    }

    if (roleName === RoleName.USER) {
        if (permission.resource !== PermissionResource.TASKS) return null;

        if (permission.action === PermissionAction.CREATE) {
            return {
                effect: RolePermissionRuleEffect.ALLOW,
                type: RolePermissionRuleType.FULL_ACCESS,
                conditions: null,
            };
        }

        if (
            permission.action === PermissionAction.READ ||
            permission.action === PermissionAction.UPDATE ||
            permission.action === PermissionAction.DELETE
        ) {
            return {
                effect: RolePermissionRuleEffect.ALLOW,
                type: RolePermissionRuleType.CONDITIONAL,
                conditions: {
                    authorId: '$$user.id',
                },
            };
        }
    }

    return null;
}

async function syncRolePermissionRule(
    tx: Prisma.TransactionClient,
    input: {
        rolePermissionId: number;
        rule: RolePermissionRuleSeed | null;
    },
) {
    await tx.rolePermissionRule.deleteMany({
        where: {
            rolePermissionId: input.rolePermissionId,
        },
    });

    if (!input.rule) {
        return;
    }

    await tx.rolePermissionRule.create({
        data: {
            rolePermissionId: input.rolePermissionId,
            effect: input.rule.effect,
            type: input.rule.type,
            conditions: input.rule.conditions ?? Prisma.JsonNull,
        },
    });
}

async function main() {
    await prisma.$transaction(async (tx) => {
        for (const [roleNameRaw, permissions] of Object.entries(ROLE_PERMISSIONS)) {
            const roleName = roleNameRaw as RoleName;

            const role = await tx.role.upsert({
                where: {
                    name: roleName,
                },
                update: {},
                create: {
                    name: roleName,
                    description: `${roleName} role`,
                },
            });

            const desiredPermissionIds: number[] = [];

            for (const permissionSeed of permissions) {
                const { resource, action } = permissionSeed;
                const key = `${resource}:${action}`;

                const permission = await tx.permission.upsert({
                    where: {
                        key,
                    },
                    update: {
                        resource,
                        action,
                    },
                    create: {
                        resource,
                        action,
                        key,
                    },
                });

                desiredPermissionIds.push(permission.id);

                const rolePermission = await tx.rolePermission.upsert({
                    where: {
                        uq_roles_permissions_role_permission: {
                            roleId: role.id,
                            permissionId: permission.id,
                        },
                    },
                    update: {},
                    create: {
                        roleId: role.id,
                        permissionId: permission.id,
                    },
                });

                const ruleSeed = getRolePermissionRuleSeed(roleName, permissionSeed);

                await syncRolePermissionRule(tx, {
                    rolePermissionId: rolePermission.id,
                    rule: ruleSeed,
                });
            }

            await tx.rolePermission.deleteMany({
                where: {
                    roleId: role.id,
                    permissionId: {
                        notIn: desiredPermissionIds,
                    },
                },
            });
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
