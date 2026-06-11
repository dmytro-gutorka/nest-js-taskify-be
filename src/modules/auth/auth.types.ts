import type { SignInLocalSchema } from './schemas/sign-in-local.schema.js';
import type { SignUpLocalSchema } from './schemas/sign-up-local.schema.js';
import { AuthProvider } from '@database/client';
import { Auth } from '@database/client';
import { z } from 'zod';

export type SignInLocalDto = z.infer<typeof SignInLocalSchema>;
export type SignUpLocalDto = z.infer<typeof SignUpLocalSchema>;

export type AuthEntity = Auth;

export interface CreateAuthDto {
    email: string;
    password: string | null;
    userId: number;
    provider: AuthProvider;
    providerAccountId?: string | null;
}

export interface AuthRegisterPayload {
    name?: string;
    email: string;
    password?: string;
    userId?: number;
    provider: AuthProvider;
    providerAccountId?: string | null;
}

export interface RefreshToken {
    refreshToken: string;
}

export interface AccessToken {
    accessToken: string;
}

export type TokensPair = RefreshToken & AccessToken;
