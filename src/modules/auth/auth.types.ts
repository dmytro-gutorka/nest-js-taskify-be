import type {SignInLocalSchema} from './schemas/sign-in-local.schema.js';
import type {SignUpLocalSchema} from './schemas/sign-up-local.schema.js';
import {AuthProvider} from '@database/client';
import {Auth} from '@database/client';
import {SetLocalPasswordSchema} from "./schemas/set-local-password.schema.js";
import {SignInGoogleSchema} from "./schemas/sign-in-google.schema.js";
import {infer as ZodInfer, z} from 'zod';
import {UpdatePrimaryEmailSchema} from "./schemas/update-primary-email.schema.js";

export type SignInLocalDto = ZodInfer<typeof SignInLocalSchema>;
export type SignUpLocalDto = ZodInfer<typeof SignUpLocalSchema>;
export type SetLocalPasswordDto = ZodInfer<typeof SetLocalPasswordSchema>;
export type SignInGoogleDto = ZodInfer<typeof SignInGoogleSchema>;
export type UpdatePrimaryEmailDto = ZodInfer<typeof UpdatePrimaryEmailSchema>;

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

export interface GoogleUserPayload {
    providerAccountId: string;
    email: string;
    name?: string;
}

export interface RefreshToken {
    refreshToken: string;
}

export interface AccessToken {
    accessToken: string;
}

export type TokensPair = RefreshToken & AccessToken;

export interface PrimaryEmailOption {
    email: string;
    providers: AuthProvider[];
    isPrimary: boolean;
}

export interface PrimaryEmailOptionsResponse {
    options: PrimaryEmailOption[];
}