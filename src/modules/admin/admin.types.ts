import type { Prisma } from '../../infrastructure/database/prisma/generated/client.js';

export type UserWithRoles = Prisma.UserGetPayload<{
    include: {
        roles: {
            include: { role: true };
        };
    };
}>;

export type UserWithPermissions = Prisma.UserGetPayload<{
    include: {
        roles: {
            include: {
                role: {
                    include: {
                        rolePermissions: {
                            include: { permission: true };
                        };
                    };
                };
            };
        };
    };
}>;

export type RoleWithPermissions = Prisma.RoleGetPayload<{
    include: {
        rolePermissions: {
            include: { permission: true };
        };
    };
}>;
