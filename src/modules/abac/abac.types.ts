import { Prisma } from '@database/client';
import { ActiveUser } from '../../common/types/common.types.js';
import { PermissionKey } from '../rbac/index.js';

export type AbacJsonPrimitive = string | number | boolean | null;

export interface AbacJsonObject {
    [key: string]: AbacJsonValue;
}

export type AbacJsonValue = AbacJsonPrimitive | AbacJsonValue[] | AbacJsonObject;

export type AbacCondition = AbacJsonObject | AbacJsonObject[] | null;

export interface AbacContext {
    user: ActiveUser;
}

export interface AbacContext {
    user: ActiveUser;
}

export type RolePermissionWithRules = Prisma.RolePermissionGetPayload<{
    include: {
        permission: true;
        rules: true;
    };
}>;

export interface BuildTaskAccessWhereInput {
    user: ActiveUser;
    permissionKey: PermissionKey;
    rolePermissions: RolePermissionWithRules[];
}

export type TaskAccessWhere = Prisma.TaskWhereInput | null;
