import { DatabaseService } from '@database';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@database/client';
import type { TaskCursorPaginatedResponse, TaskEntity } from '../tasks.types.js';
import { buildTaskSearchWhere } from '../utils/buildTaskSearchWhere.js';
import { TaskQueryDto } from '../dto/task-query.dto.js';
import { SortOrder } from '../../../common/enums/sort-order.enum.js';
import { CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination-query.dto.js';
import { CreateTaskDto } from '../dto/create-task.dto.js';
import { UpdateTaskDto } from '../dto/update-task.dto.js';
import { PagePaginatedResponse } from '../../../common/types/common.types.js';

@Injectable()
export class TasksRepository {
    constructor(private readonly database: DatabaseService) {}

    async findAll(
        accessWhere: Prisma.TaskWhereInput,
        query: TaskQueryDto,
    ): Promise<PagePaginatedResponse<TaskEntity>> {
        const {
            search,
            searchBy,
            order = SortOrder.DESC,
            sortBy = 'createdAt',
            page = 1,
            limit = 10,
            status,
            priority,
        } = query;

        const queryWhere: Prisma.TaskWhereInput = {
            status,
            priority,
            ...buildTaskSearchWhere(search, searchBy),
        };

        const where: Prisma.TaskWhereInput = {
            AND: [accessWhere, queryWhere],
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
        query: CursorPaginationQueryDto,
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

    async findOneById(taskId: number, accessWhere: Prisma.TaskWhereInput) {
        return this.database.task.findFirst({
            where: {
                AND: [{ id: taskId }, accessWhere],
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

    async update(taskId: number, accessWhere: Prisma.TaskWhereInput, updateTaskDto: UpdateTaskDto) {
        // @gutnidev не совсем понимаю зачем и тут findOneById
        const task = await this.findOneById(taskId, accessWhere);
        if (!task) return null;

        return this.database.task.update({
            where: { id: task.id },
            data: updateTaskDto,
        });
    }

    async delete(taskId: number, accessWhere: Prisma.TaskWhereInput): Promise<boolean> {
        // @gutnidev не совсем понимаю зачем и тут findOneById
        const task = await this.findOneById(taskId, accessWhere);
        if (!task) return false;

        await this.database.task.delete({
            where: {
                id: task.id,
            },
        });

        return true;
    }
}
