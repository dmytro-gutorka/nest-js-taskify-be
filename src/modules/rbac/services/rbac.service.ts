import { Injectable } from '@nestjs/common';
import { Prisma } from '@database/client';
import { RoleName } from '../../../infrastructure/database/prisma/generated/enums.js';
import { RbacCacheService } from './rbac-cache.service.js';
import { RbacRepository } from '../repositories/rbac.repository.js';

@Injectable()
export class RbacService {
    constructor(
        private readonly rbacCacheService: RbacCacheService,
        private readonly rbacRepository: RbacRepository,
    ) {}

    async getUserPermissionKeys(userId: number): Promise<Set<string>> {
        return this.rbacCacheService.getUserPermissionKeys(userId);
    }

    async getUserRoleNames(userId: number): Promise<Set<RoleName>> {
        return this.rbacRepository.getUserRoleNames(userId);
    }

    async assignRoleToUser(
        userId: number,
        roleName: RoleName,
        tx?: Prisma.TransactionClient,
    ): Promise<void> {
        return this.rbacCacheService.assignRoleToUser(userId, roleName, tx);
    }
}
