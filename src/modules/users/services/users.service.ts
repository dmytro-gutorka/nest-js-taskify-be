import { NotFoundException, Injectable, ConflictException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository.js';
import {
    UserResponse,
    UserEntity,
    UserListItemResponse,
    UserDetailsResponse,
} from '../users.types.js';
import { UserAvatarService } from '../../media/services/user-avatar.service.js';
import type { UploadUserAvatarInput } from '../../media/media.types.js';
import { UpdateUserDto } from '../dto/update-user.dto.js';
import { MessageResponse } from '../../../common/types/responses.types.js';
import { RbacService } from '../../rbac/services/rbac.service.js';
import { UsersPageQueryDto } from '../dto/users-page-query.dto.js';
import { PagePaginatedResponse } from '../../../common/types/common.types.js';
import { RoleName } from '../../../infrastructure/database/prisma/generated/enums.js';

@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly userAvatarService: UserAvatarService,
        private readonly rbacService: RbacService,
    ) {}

    async findAll(query: UsersPageQueryDto): Promise<PagePaginatedResponse<UserListItemResponse>> {
        const [users, total] = await Promise.all([
            this.usersRepository.findMany(query),
            this.usersRepository.count({ search: query.search }),
        ]);

        const rolesByUserId = await this.rbacService.getRoleNamesByUserIds(
            users.map((user) => user.id),
        );

        return {
            items: users.map((user) => ({
                id: user.id,
                email: user.email,
                name: user.name,
                surname: user.surname,
                roles: rolesByUserId.get(user.id) ?? [],
                createdAt: user.createdAt,
            })),
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        };
    }

    async findOne(id: number): Promise<UserDetailsResponse> {
        const user = await this.usersRepository.findOne(id);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const [roles, permissions, mappedUser] = await Promise.all([
            this.rbacService.getUserRoleNamesList(id),
            this.rbacService.getUserPermissionKeys(id),
            this.toUserResponse(user),
        ]);

        return {
            ...mappedUser,
            roles,
            permissions,
        };
    }

    async updateUserRoles(userId: number, roles: RoleName[]): Promise<UserDetailsResponse> {
        const user = await this.usersRepository.findOne(userId);

        if (!user) throw new NotFoundException('User not found');

        await this.rbacService.setUserRoles(userId, roles);

        return this.findOne(userId);
    }

    async update(userId: number, updateUserDto: UpdateUserDto): Promise<UserResponse> {
        const updatedUser = await this.usersRepository.update(userId, updateUserDto);

        if (!updatedUser) {
            throw new NotFoundException('User not found');
        }

        return await this.toUserResponse(updatedUser);
    }

    async updatePrimaryEmail(userId: number, email: string): Promise<UserResponse> {
        const existingUserWithEmail = await this.usersRepository.findByEmail(email);

        if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
            throw new ConflictException('Email is already used as primary email by another user');
        }

        const updatedUser = await this.usersRepository.updatePrimaryEmail(userId, email);

        if (!updatedUser) {
            throw new NotFoundException('User not found');
        }

        return await this.toUserResponse(updatedUser);
    }

    async delete(userId: number): Promise<MessageResponse> {
        const user = await this.usersRepository.findOne(userId);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.userAvatarService.tryDeleteAllByUserId(user.id);

        const isDeleted = await this.usersRepository.delete(user.id);

        if (!isDeleted) {
            throw new NotFoundException('User not found');
        }

        return {
            message: 'User deleted successfully',
        };
    }

    async uploadAvatar(
        userId: number,
        avatar: UploadUserAvatarInput,
    ): Promise<UserDetailsResponse> {
        const user = await this.usersRepository.findOne(userId);

        if (!user) throw new NotFoundException('User not found');

        await this.userAvatarService.uploadUserAvatar(user.id, avatar);

        return this.findOne(user.id);
    }

    private async toUserResponse(user: UserEntity): Promise<UserResponse> {
        const avatarUrl = await this.userAvatarService.getCurrentAvatarUrl(user.id);

        return {
            id: user.id,
            email: user.email,
            name: user.name,
            surname: user.surname,
            birthday: user.birthday,
            avatarUrl,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
}
