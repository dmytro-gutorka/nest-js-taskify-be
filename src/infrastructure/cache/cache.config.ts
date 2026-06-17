import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const DEFAULT_RBAC_PERMISSIONS_CACHE_TTL_SECONDS = 300;
const DEFAULT_TASK_LIST_CACHE_TTL_SECONDS = 60;
const DEFAULT_TASK_ITEM_CACHE_TTL_SECONDS = 120;
const SCAN_BATCH_SIZE = 100;

const CacheEnvSchema = z.object({
    REDIS_HOST: z.string().min(1),
    REDIS_PORT: z.coerce.number().int().positive(),
    RBAC_PERMISSIONS_CACHE_TTL_SECONDS: z.coerce
        .number()
        .int()
        .positive()
        .default(DEFAULT_RBAC_PERMISSIONS_CACHE_TTL_SECONDS),
    TASK_LIST_CACHE_TTL_SECONDS: z.coerce
        .number()
        .int()
        .positive()
        .default(DEFAULT_TASK_LIST_CACHE_TTL_SECONDS),
    TASK_ITEM_CACHE_TTL_SECONDS: z.coerce
        .number()
        .int()
        .positive()
        .default(DEFAULT_TASK_ITEM_CACHE_TTL_SECONDS),

    SCAN_BATCH_SIZE: z.coerce.number().int().positive().default(SCAN_BATCH_SIZE),
});

export const cacheEnvConfig = registerAs('cache', () => {
    const env = CacheEnvSchema.parse(process.env);

    return {
        redisHost: env.REDIS_HOST,
        redisPort: env.REDIS_PORT,
        rbacPermissionsTtl: env.RBAC_PERMISSIONS_CACHE_TTL_SECONDS,
        taskListTtl: env.TASK_LIST_CACHE_TTL_SECONDS,
        taskItemTtl: env.TASK_ITEM_CACHE_TTL_SECONDS,
        scanBatchSize: env.SCAN_BATCH_SIZE,
    };
});

export type CacheConfig = ReturnType<typeof cacheEnvConfig>;
