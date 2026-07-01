import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@database';
import type { UserEntity } from '../users.types.js';
import { CreateUserDto } from '../dto/create-user.dto.js';
import { UpdateUserDto } from '../dto/update-user.dto.js';
import { Prisma } from '@database/client';
import { UsersPageQueryDto } from '../dto/users-page-query.dto.js';
import { SortOrder } from '../../../common/enums/sort-order.enum.js';
import { Nullable } from '../../../common/types/common.types.js';

@Injectable()
export class UsersRepository {
    constructor(private readonly database: DatabaseService) {}

    async findMany(query: UsersPageQueryDto): Promise<UserEntity[]> {
        const { page, limit, search } = query;
        const skip = (page - 1) * limit;

        return this.database.user.findMany({
            where: this.buildUsersWhere(search),
            skip,
            take: limit,
            orderBy: { createdAt: SortOrder.DESC },
        });
    }

    async findOne(id: number): Promise<Nullable<UserEntity>> {
        return this.database.user.findUnique({
            where: { id },
        });
    }

    async findByEmail(email: string): Promise<Nullable<UserEntity>> {
        return this.database.user.findUnique({
            where: { email },
        });
    }

    async create(createUserDto: CreateUserDto): Promise<UserEntity> {
        return this.database.user.create({
            data: createUserDto,
        });
    }

    async update(id: number, updateUserDto: UpdateUserDto): Promise<UserEntity | null> {
        // @gutnidev не совсем понимаю зачем и тут findOne
        const existingUser = await this.findOne(id);

        if (!existingUser) return null;

        return this.database.user.update({
            where: { id },
            data: updateUserDto,
        });
    }

    async updatePrimaryEmail(id: number, email: string): Promise<UserEntity | null> {
        // @gutnidev не совсем понимаю зачем и тут findOne
        const existingUser = await this.findOne(id);

        if (!existingUser) return null;

        return this.database.user.update({
            where: { id },
            data: { email },
        });
    }

    async delete(id: number): Promise<boolean> {
        // @gutnidev не совсем понимаю зачем и тут findOne
        const existingUser = await this.findOne(id);

        if (!existingUser) return false;

        await this.database.user.delete({ where: { id } });

        return true;
    }

    async count(query: Pick<UsersPageQueryDto, 'search'>): Promise<number> {
        return this.database.user.count({
            where: this.buildUsersWhere(query.search),
        });
    }

    private buildUsersWhere(search?: string): Prisma.UserWhereInput {
        if (!search) return {};

        return {
            OR: [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { surname: { contains: search, mode: 'insensitive' } },
            ],
        };
    }
}
