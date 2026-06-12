import { AuthProvider, PasswordResetToken } from '@database/client';
import { Auth } from '@database/client';

export type AuthEntity = Auth;
export type PasswordResetTokenEntity = PasswordResetToken;

export interface CreateAuthInput {
    email: string;
    password: string | null;
    userId: number;
    provider: AuthProvider;
    providerAccountId?: string | null;
}

export interface AuthRegisterInput {
    name?: string;
    email: string;
    password?: string;
    userId?: number;
    provider: AuthProvider;
    providerAccountId?: string | null;
}

export interface CreatePasswordResetTokenInput {
    userId: number;
    authId: number;
    tokenHash: string;
    expiresAt: Date;
}

export interface PrimaryEmailOption {
    email: string;
    providers: AuthProvider[];
    isPrimary: boolean;
}

export interface PrimaryEmailOptionsResponse {
    options: PrimaryEmailOption[];
}

export interface AccessTokenResponse {
    accessToken: string;
}

export interface TokensPair {
    refreshToken: string;
    accessToken: string;
}

export interface VerifiedGoogleUser {
    providerAccountId: string;
    email: string;
    name?: string;
}
