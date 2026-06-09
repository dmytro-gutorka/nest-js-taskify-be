import type { infer as ZodInfer } from 'zod';
import type { CreateUserSchema } from './schemas/create-user.schema.js';
import type { UpdateUserSchema } from './schemas/update-user.schema.js';
import type { Nullable } from '@common/types';
import type { User } from '@database/client';

export type CreateUserDto = ZodInfer<typeof CreateUserSchema>;
export type UpdateUserDto = ZodInfer<typeof UpdateUserSchema>;

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
