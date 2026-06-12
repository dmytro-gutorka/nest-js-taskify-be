import type {SignInLocalSchema} from './schemas/sign-in-local.schema.js';
import type {SignUpLocalSchema} from './schemas/sign-up-local.schema.js';
import {AuthProvider, PasswordResetToken} from '@database/client';
import {SetLocalPasswordSchema} from "./schemas/set-local-password.schema.js";
import {SignInGoogleSchema} from "./schemas/sign-in-google.schema.js";
import {UpdatePrimaryEmailSchema} from "./schemas/update-primary-email.schema.js";
import {ConfirmPasswordResetSchema} from "./schemas/confirm-password-reset.schema.js";
import {Auth} from '@database/client';
import {infer as ZodInfer, z} from 'zod';

export type SignInLocalDto = ZodInfer<typeof SignInLocalSchema>;
export type SignUpLocalDto = ZodInfer<typeof SignUpLocalSchema>;
export type SetLocalPasswordDto = ZodInfer<typeof SetLocalPasswordSchema>;
export type SignInGoogleDto = ZodInfer<typeof SignInGoogleSchema>;
export type UpdatePrimaryEmailDto = ZodInfer<typeof UpdatePrimaryEmailSchema>;
export type ConfirmPasswordResetDto = z.infer<typeof ConfirmPasswordResetSchema>;

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