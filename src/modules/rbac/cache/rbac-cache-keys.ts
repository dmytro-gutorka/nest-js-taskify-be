export const RbacCacheKeys = {
    userPermissions: (userId: number) => `rbac:user:${userId}:permissions`,
    userRoles: (userId: number) => `rbac:user:${userId}:roles`,
} as const;
