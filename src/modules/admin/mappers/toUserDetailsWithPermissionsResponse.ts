import { UserWithPermissions } from '../admin.types.js';

export function toUserDetailsWithPermissionsResponse(user: UserWithPermissions) {
    const permissions = [
        ...new Set(
            user.roles.flatMap((userRole) =>
                userRole.role.rolePermissions.map((rp) => rp.permission.key),
            ),
        ),
    ];

    return {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        roles: user.roles.map((userRole) => userRole.role.name),
        permissions,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}
