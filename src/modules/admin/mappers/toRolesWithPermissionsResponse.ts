import { RoleWithPermissions } from '../admin.types.js';

export function toRolesWithPermissionsResponse(role: RoleWithPermissions) {
    return {
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.rolePermissions.map((rolePermissions) => ({
            id: rolePermissions.permission.id,
            resource: rolePermissions.permission.resource,
            action: rolePermissions.permission.action,
            key: rolePermissions.permission.key,
            description: rolePermissions.permission.description,
        })),
    };
}
