import { Injectable } from '@nestjs/common';
import type { UserEntity, CreateUserDto, UpdateUserDto } from '../users.types.js';
import { DatabaseService } from '../../../infrastructure/database/index.js';

@Injectable()
export class UsersRepository {
    constructor(private readonly database: DatabaseService) {}

    findOne(id: number): Promise<UserEntity | null> {
        return this.database.user.findUnique({
            where: {
                id,
            },
        });
    }

    findByEmail(email: string): Promise<UserEntity | null> {
        return this.database.user.findUnique({
            where: {
                email,
            },
        });
    }

    async create(createUserDto: CreateUserDto): Promise<UserEntity> {
        return this.database.user.create({
            data: createUserDto,
        });
    }

    async update(id: number, updateUserDto: UpdateUserDto): Promise<UserEntity | null> {
        const existingUser = await this.findOne(id);

        if (!existingUser) {
            return null;
        }

        return this.database.user.update({
            where: {
                id,
            },
            data: updateUserDto,
        });
    }

    async updatePrimaryEmail(id: number, email: string): Promise<UserEntity | null> {
        const existingUser = await this.findOne(id);

        if (!existingUser) {
            return null;
        }

        return this.database.user.update({
            where: {
                id,
            },
            data: {
                email,
            },
        });
    }

    async updateLastLoginAt(id: number, lastLoginAt: Date): Promise<UserEntity | null> {
        const existingUser = await this.findOne(id);

        if (!existingUser) {
            return null;
        }

        return this.database.user.update({
            where: {
                id,
            },
            data: {
                lastLoginAt,
            },
        });
    }

    async delete(id: number): Promise<boolean> {
        const existingUser = await this.findOne(id);

        if (!existingUser) {
            return false;
        }

        await this.database.user.delete({
            where: {
                id,
            },
        });

        return true;
    }
}
