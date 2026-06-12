import { Nullable } from '../../common/types/common.types.js';

import type { User } from '@database/client';

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

export interface UserAuthModel {
    id: number;
    email: string;
}

export type UserEntity = User;
