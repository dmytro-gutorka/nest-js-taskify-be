import { Nullable } from '../../common/types/common.types.js';
import { PermissionKey } from '../rbac/index.js';
import type { User } from '@database/client';
import type { RoleName } from '@database/enums';

export interface UserResponse {
    id: number;
    email: string;
    name: Nullable<string>;
    surname: Nullable<string>;
    birthday: Nullable<Date>;
    avatarUrl: Nullable<string>;
    lastLoginAt: Nullable<Date>;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserListItemResponse {
    id: number;
    email: string;
    name: Nullable<string>;
    surname: Nullable<string>;
    roles: RoleName[];
    createdAt: Date;
}

export interface UserDetailsResponse extends UserResponse {
    roles: RoleName[];
    permissions: PermissionKey[];
}

export type UserEntity = User;
