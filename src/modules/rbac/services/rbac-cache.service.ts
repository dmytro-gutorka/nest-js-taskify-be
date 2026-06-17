import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@database/client';
import { RoleName } from '../../../infrastructure/database/prisma/generated/enums.js';
import { RbacRepository } from '../repositories/rbac.repository.js';
import { CacheService, CacheKeyFactory } from '../../../infrastructure/cache/index.js';
import type { CacheConfig } from '../../../infrastructure/cache/index.js';

@Injectable()
export class RbacCacheService {
    private readonly ttl: number;

    constructor(
        private readonly rbacRepository: RbacRepository,
        private readonly cacheService: CacheService,
        private readonly configService: ConfigService,
    ) {
        this.ttl = this.configService.getOrThrow<CacheConfig>('cache').rbacPermissionsTtl;
    }

    async getUserPermissionKeys(userId: number): Promise<Set<string>> {
        const cacheKey = CacheKeyFactory.rbacUserPermissions(userId);

        const cached = await this.cacheService.get<string[]>(cacheKey);
        if (cached) return new Set(cached);

        const userRoles = await this.rbacRepository.getUserRolesWithPermissions(userId);

        const keys = userRoles.flatMap((userRole) =>
            userRole.role.rolePermissions.map((rp) => rp.permission.key),
        );

        await this.cacheService.set(cacheKey, keys, this.ttl);

        return new Set(keys);
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
