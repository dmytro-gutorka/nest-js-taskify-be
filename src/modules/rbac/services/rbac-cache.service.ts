import { Inject, Injectable } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';

import { RoleName } from '../../../infrastructure/database/prisma/generated/enums.js';
import { CacheService } from '../../../infrastructure/cache/index.js';
import { PermissionKey } from '../rbac.types.js';
import { RbacCacheKeys } from '../cache/rbac-cache-keys.js';
import { rbacCacheConfig } from '../configs/rbac-cache.config.js';

@Injectable()
export class RbacCacheService {
    constructor(
        @Inject(rbacCacheConfig.KEY)
        private readonly rbacConfig: ConfigType<typeof rbacCacheConfig>,
        private readonly cacheService: CacheService,
    ) {}

    async getUserPermissionKeys(userId: number): Promise<PermissionKey[] | null> {
        const cacheKey = RbacCacheKeys.userPermissions(userId);

        const cached = await this.cacheService.get<PermissionKey[]>(cacheKey);

        if (!cached) return null;

        return [...new Set(cached)];
    }

    async setUserPermissionKeys(userId: number, permissionKeys: PermissionKey[]): Promise<void> {
        const cacheKey = RbacCacheKeys.userPermissions(userId);

        await this.cacheService.set(
            cacheKey,
            [...new Set(permissionKeys)],
            this.rbacConfig.userAccessTtl,
        );
    }

    async getUserRoleNames(userId: number): Promise<RoleName[] | null> {
        const cacheKey = RbacCacheKeys.userRoles(userId);

        const cached = await this.cacheService.get<RoleName[]>(cacheKey);

        if (!cached) return null;

        return [...new Set(cached)];
    }

    async setUserRoleNames(userId: number, roles: RoleName[]): Promise<void> {
        const cacheKey = RbacCacheKeys.userRoles(userId);

        await this.cacheService.set(cacheKey, [...new Set(roles)], this.rbacConfig.userAccessTtl);
    }

    async invalidateUserPermissions(userId: number): Promise<void> {
        await this.cacheService.del(RbacCacheKeys.userPermissions(userId));
    }

    async invalidateUserRoles(userId: number): Promise<void> {
        await this.cacheService.del(RbacCacheKeys.userRoles(userId));
    }

    async invalidateUserAccess(userId: number): Promise<void> {
        await Promise.all([
            this.invalidateUserPermissions(userId),
            this.invalidateUserRoles(userId),
        ]);
    }
}
