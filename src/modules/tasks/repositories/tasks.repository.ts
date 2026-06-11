import { DatabaseService } from '@database';
import { Injectable } from '@nestjs/common';
import { SortOrder } from '@common/enums';
import { Prisma } from '@database/client';
import type {
    TaskFindAllQuery,
    TaskPagePaginatedResponse,
    TaskCursorQuery,
    TaskCursorPaginatedResponse,
    CreateTaskDto,
    UpdateTaskDto,
    TaskEntity,
} from '../task.types.js';
import { buildTaskSearchWhere } from '../utils/buildTaskSearchWhere.js';

@Injectable()
export class TasksRepository {
    constructor(private readonly database: DatabaseService) {}

    async findAll(
        authorId: number,
        query: TaskFindAllQuery,
    ): Promise<TaskPagePaginatedResponse<TaskEntity>> {
        const {
            search,
            searchBy,
            order = SortOrder.DESC,
            sortBy = 'createdAt',
            page = 1,
            limit = 20,
            status,
            priority,
        } = query;

        const where: Prisma.TaskWhereInput = {
            authorId,
            status,
            priority,
            ...buildTaskSearchWhere(search, searchBy),
        };

        const orderBy = { [sortBy]: order };
        const skip = (page - 1) * limit;
        const [items, total] = await this.database.$transaction([
            this.database.task.findMany({
                where,
                orderBy,
                skip,
                take: limit,
            }),
            this.database.task.count({ where }),
        ]);

        return {
            items,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findFeed(
        authorId: number,
        query: TaskCursorQuery,
    ): Promise<TaskCursorPaginatedResponse<TaskEntity>> {
        const { cursor, limit = 10 } = query;

        const items = await this.database.task.findMany({
            where: {
                authorId,
                isPrivate: false,
            },
            orderBy: { id: SortOrder.DESC },
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        });

        const hasNextPage = items.length > limit;
        const slicedItems = hasNextPage ? items.slice(0, limit) : items;
        const nextCursor = hasNextPage ? (slicedItems[slicedItems.length - 1]?.id ?? null) : null;

        return {
            items: slicedItems,
            nextCursor,
        };
    }

    async findOne(id: number, authorId?: number) {
        return this.database.task.findFirst({
            where: {
                id,
                ...(authorId ? { authorId } : {}),
            },
        });
    }

    async create(createTaskDto: CreateTaskDto, authorId: number) {
        return this.database.task.create({
            data: {
                ...createTaskDto,
                authorId,
            },
        });
    }

    async update(id: number, updateTaskDto: UpdateTaskDto, authorId?: number) {
        const task = await this.findOne(id, authorId);

        if (!task) {
            return null;
        }

        return this.database.task.update({
            where: { id: task.id },
            data: updateTaskDto,
        });
    }

    async delete(id: number, authorId?: number): Promise<boolean> {
        const task = await this.findOne(id, authorId);

        if (!task) {
            return false;
        }

        await this.database.task.delete({
            where: {
                id: task.id,
            },
        });

        return true;
    }
}
