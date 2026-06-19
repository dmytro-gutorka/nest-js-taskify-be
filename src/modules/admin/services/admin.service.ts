import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminRepository } from '../repositories/admin.repository.js';
import { RbacCacheService } from '../../rbac/services/rbac-cache.service.js';
import type { AdminUsersQueryDto } from '../dto/admin-users-query.dto.js';
import type { UpdateUserRolesDto } from '../dto/update-user-roles.dto.js';
import { UserWithRoles, UserWithPermissions, RoleWithPermissions } from '../admin.types.js';
import { PagePaginatedResponse } from '../../../common/types/common.types.js';
import { Permission } from '../../../infrastructure/database/prisma/generated/client.js';

@Injectable()
export class AdminService {
    constructor(
        private readonly adminRepository: AdminRepository,
        private readonly rbacCacheService: RbacCacheService,
    ) {}

    async getUsers(query: AdminUsersQueryDto): Promise<PagePaginatedResponse<UserWithRoles>> {
        const { items, total } = await this.adminRepository.findUsers(query);
        const { page, limit } = query;

        return {
            items,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getUserById(id: number): Promise<UserWithPermissions> {
        const user = await this.adminRepository.findUserById(id);

        if (!user) throw new NotFoundException('User not found');

        return user;
    }

    async updateUserRoles(userId: number, dto: UpdateUserRolesDto): Promise<UserWithPermissions> {
        const user = await this.adminRepository.findUserById(userId);

        if (!user) throw new NotFoundException('User not found');

        await this.adminRepository.setUserRoles(userId, dto.roles);
        await this.rbacCacheService.invalidateUserPermissions(userId);

        return this.getUserById(userId);
    }

    async getRoles(): Promise<RoleWithPermissions[]> {
        return this.adminRepository.findAllRoles();
    }

    async getPermissions(): Promise<Permission[]> {
        return this.adminRepository.findAllPermissions();
    }
}
