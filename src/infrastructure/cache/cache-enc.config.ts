import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const cacheEnvSchema = z.object({
    REDIS_HOST: z.string().min(1),
    REDIS_PORT: z.coerce.number().int().positive(),
});

export const cacheEnvConfig = registerAs('cache', () => {
    const env = cacheEnvSchema.parse(process.env);

    return {
        redisHost: env.REDIS_HOST,
        redisPort: env.REDIS_PORT,
    };
});

export type CacheEncConfig = ReturnType<typeof cacheEnvConfig>;
