import {registerAs} from '@nestjs/config';
import {z} from 'zod';

const DEFAULT_ACCESS_TOKEN_TTL = 15 * 60;
const DEFAULT_REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;
const DEFAULT_SALT_ROUNDS = 10;
const DEFAULT_RESET_PASSWORD_TOKEN_TTL_MS = 15 * 60 * 1000;
const DEFAULT_RESET_PASSWORD_TOKEN_BYTES = 32;

const AuthEnvSchema = z.object({
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    ACCESS_TOKEN_TTL: z.coerce
        .number()
        .min(1, 'ACCESS_TOKEN_TTL is required')
        .default(DEFAULT_ACCESS_TOKEN_TTL),
    REFRESH_TOKEN_TTL: z.coerce
        .number()
        .min(1, 'REFRESH_TOKEN_TTL is required')
        .default(DEFAULT_REFRESH_TOKEN_TTL),
    JWT_SALT_ROUNDS: z.coerce.number().positive().default(DEFAULT_SALT_ROUNDS),
    APP_ENV: z.enum(['dev', 'prod', 'test']).default('dev'),

    GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID is required'),

    APP_FRONTEND_URL: z.string('APP_FRONTEND_URL must be valid url'),

    RESET_PASSWORD_TOKEN_BYTES: z.coerce.number().int().positive().default(DEFAULT_RESET_PASSWORD_TOKEN_BYTES),
    RESET_PASSWORD_TOKEN_TTL_MS: z.coerce
        .number()
        .int()
        .positive()
        .default(DEFAULT_RESET_PASSWORD_TOKEN_TTL_MS),

});

export const authEnvConfig = registerAs('auth', () => {
    const env = AuthEnvSchema.parse(process.env);

    return {
        googleClientId: env.GOOGLE_CLIENT_ID,
        jwtSecret: env.JWT_SECRET,
        accessTokenTtl: env.ACCESS_TOKEN_TTL,
        refreshTokenTtl: env.REFRESH_TOKEN_TTL,
        saltRounds: env.JWT_SALT_ROUNDS,
        appEnvironment: env.APP_ENV,

        frontendUrl: env.APP_FRONTEND_URL,
        resetPasswordTokenBytes: env.RESET_PASSWORD_TOKEN_BYTES,
        resetPasswordTokenTtlMs: env.RESET_PASSWORD_TOKEN_TTL_MS,
    };
});
