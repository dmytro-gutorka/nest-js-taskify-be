import { AuthProvider } from '../../infrastructure/database/prisma/generated/enums.js';

export type Nullable<T> = T | null;
export type ValueOf<T> = T[keyof T];

export interface ActiveUser {
    id: number;
    email: string;
    provider: AuthProvider;
}
