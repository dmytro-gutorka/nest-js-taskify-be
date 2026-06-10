import { NotFoundException, Injectable, ConflictException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository.js';
import type { MessageResponse } from '@common/types';
import type {
    UserResponse,
    UserAuthModel,
    CreateUserDto,
    UpdateUserDto,
    UserEntity,
} from '../users.types.js';

@Injectable()
export class UsersService {
    constructor(private readonly usersRepository: UsersRepository) {}

    async findOne(id: number): Promise<UserResponse> {
        const user = await this.usersRepository.findOne(id);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.toUserResponse(user);
    }

    async findOneUserAuthModel(id: number): Promise<UserAuthModel> {
        const user = await this.usersRepository.findOne(id);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.toUserAuthModel(user);
    }

    async findOneUserAuthModelByEmailOrNull(email: string): Promise<UserAuthModel | null> {
        const user = await this.usersRepository.findByEmail(email);

        if (!user) {
            return null;
        }

        return this.toUserAuthModel(user);
    }

    async create(createUserDto: CreateUserDto): Promise<UserResponse> {
        const existingUser = await this.usersRepository.findByEmail(createUserDto.email);

        if (existingUser) {
            throw new ConflictException('User already exists');
        }

        const user = await this.usersRepository.create(createUserDto);

        return this.toUserResponse(user);
    }

    async update(userId: number, updateUserDto: UpdateUserDto): Promise<UserResponse> {
        const updatedUser = await this.usersRepository.update(userId, updateUserDto);

        if (!updatedUser) {
            throw new NotFoundException('User not found');
        }

        return this.toUserResponse(updatedUser);
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

        return this.toUserResponse(updatedUser);
    }

    async updateLastLoginAt(userId: number): Promise<UserResponse> {
        const updatedUser = await this.usersRepository.updateLastLoginAt(userId, new Date());

        if (!updatedUser) {
            throw new NotFoundException('User not found');
        }

        return this.toUserResponse(updatedUser);
    }

    async delete(userId: number): Promise<MessageResponse> {
        const isDeleted = await this.usersRepository.delete(userId);

        if (!isDeleted) {
            throw new NotFoundException('User not found');
        }

        return {
            message: 'User deleted successfully',
        };
    }

    private toUserResponse(user: UserEntity): UserResponse {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            surname: user.surname,
            birthday: user.birthday,
            avatarUrl: null,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    private toUserAuthModel(user: UserEntity): UserAuthModel {
        return {
            id: user.id,
            email: user.email,
        };
    }
}
