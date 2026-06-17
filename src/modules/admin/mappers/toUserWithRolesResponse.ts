import type { UserWithRoles } from '../admin.types.js';

export function toUserWithRolesResponse(user: UserWithRoles) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        roles: user.roles.map((userRole) => userRole.role.name),
        createdAt: user.createdAt,
    };
}
