import { Injectable, Inject } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { Prisma } from '@database/client';
import { RoleName } from '../../../infrastructure/database/prisma/generated/enums.js';
import { RbacRepository } from '../repositories/rbac.repository.js';
import {
    CacheService,
    CacheKeyFactory,
    cacheEnvConfig,
} from '../../../infrastructure/cache/index.js';

@Injectable()
export class RbacCacheService {
    constructor(
        private readonly rbacRepository: RbacRepository,
        private readonly cacheService: CacheService,

        @Inject(cacheEnvConfig.KEY)
        private readonly cacheConfig: ConfigType<typeof cacheEnvConfig>,
    ) {}

    async getUserPermissionKeys(userId: number): Promise<Set<string>> {
        const cacheKey = CacheKeyFactory.rbacUserPermissions(userId);

        const cached = await this.cacheService.get<string[]>(cacheKey);
        if (cached) return new Set(cached);

        const userRoles = await this.rbacRepository.getUserRolesWithPermissions(userId);

        const keys = userRoles.flatMap((userRole) =>
            userRole.role.rolePermissions.map((rp) => rp.permission.key),
        );

        await this.cacheService.set(cacheKey, keys, this.cacheConfig.rbacPermissionsTtl);

        return new Set(keys);
    }

    async invalidateUserPermissions(userId: number): Promise<void> {
        await this.cacheService.del(CacheKeyFactory.rbacUserPermissions(userId));
    }

    async assignRoleToUser(
        userId: number,
        roleName: RoleName,
        tx?: Prisma.TransactionClient,
    ): Promise<void> {
        const role = await this.rbacRepository.findRoleByName(roleName, tx);
        await this.rbacRepository.assignRoleToUser(userId, role.id, tx);

        await this.cacheService.del(CacheKeyFactory.rbacUserPermissions(userId));
    }
}
