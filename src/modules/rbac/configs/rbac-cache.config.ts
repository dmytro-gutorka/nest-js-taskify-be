import { registerAs } from '@nestjs/config';

export const rbacCacheConfig = registerAs('rbacCache', () => ({
    userAccessTtl: Number(process.env.RBAC_USER_ACCESS_CACHE_TTL ?? 300),
}));
