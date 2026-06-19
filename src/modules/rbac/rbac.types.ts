import {
    PermissionResource,
    PermissionAction,
    RoleName,
} from '../../infrastructure/database/prisma/generated/enums.js';
import { ValueOf } from '../../common/types/common.types.js';

export type RbacResourceValue = ValueOf<typeof PermissionResource>;
export type RbacActionValue = ValueOf<typeof PermissionAction>;

export type PermissionKey = `${RbacResourceValue}:${RbacActionValue}`;

export interface PermissionResponse {
    id: number;
    resource: PermissionResource;
    action: PermissionAction;
    key: PermissionKey;
    description: string | null;
}

export interface RoleWithPermissionsResponse {
    id: number;
    name: RoleName;
    description: string;
    permissions: PermissionResponse[];
}
