import {DatabaseService} from '@database';
import {Injectable} from '@nestjs/common';
import {Prisma} from '@database/client';
import {TaskCursorPaginatedResponse, TaskEntity, TaskCoordinates} from '../tasks.types.js';
import {buildTaskSearchWhere} from '../utils/buildTaskSearchWhere.js';
import {TaskQueryDto} from '../dto/task-query.dto.js';
import {SortOrder} from '../../../common/enums/sort-order.enum.js';
import {CursorPaginationQueryDto} from '../../../common/dto/cursor-pagination-query.dto.js';
import {CreateTaskDto} from '../dto/create-task.dto.js';
import {UpdateTaskDto} from '../dto/update-task.dto.js';
import {PagePaginatedResponse, Nullable} from '../../../common/types/common.types.js';
import {TaskMapQueryDto} from "../dto/task-map-query.dto.js";
import {DEFAULT_TASKS_MAP_LIMIT} from "../tasks.constants.js";

@Injectable()
export class TasksRepository {
    constructor(private readonly database: DatabaseService) {
    }

    async findMapTasks(
        accessWhere: Prisma.TaskWhereInput,
        query: TaskMapQueryDto,
    ): Promise<TaskEntity[]> {
        const { north, south, east, west, status, priority } = query;

        return this.database.task.findMany({
            where: {
                AND: [
                    accessWhere,
                    {
                        status,
                        priority,
                        latitude: {
                            gte: south,
                            lte: north,
                        },
                        longitude: {
                            gte: west,
                            lte: east,
                        },
                    },
                ],
            },
            orderBy: {
                createdAt: SortOrder.DESC,
            },
            take: DEFAULT_TASKS_MAP_LIMIT,
        });
    }

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

        const orderBy = {[sortBy]: order};
        const skip = (page - 1) * limit;
        const [items, total] = await this.database.$transaction([
            this.database.task.findMany({
                where,
                orderBy,
                skip,
                take: limit,
            }),
            this.database.task.count({where}),
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
        const {cursor, limit = 10} = query;

        const items = await this.database.task.findMany({
            where: {
                authorId,
                isPrivate: false,
            },
            orderBy: {id: SortOrder.DESC},
            take: limit + 1,
            ...(cursor ? {cursor: {id: cursor}, skip: 1} : {}),
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
                AND: [{id: taskId}, accessWhere],
            },
        });
    }

    async create(createTaskDto: CreateTaskDto, authorId: number) {
        const task = await this.database.task.create({
            data: {
                ...createTaskDto,
                authorId,
            },
        });

        await this.syncTaskPostgisLocation(task.id, createTaskDto)

        return this.database.task.findUniqueOrThrow({
            where: {id: task.id}
        })
    }

    async update(taskId: number, accessWhere: Prisma.TaskWhereInput, updateTaskDto: UpdateTaskDto) {
        const task = await this.findOneById(taskId, accessWhere);

        if (!task) return null;

        const updatedTask = await this.database.task.update({
            where: {id: task.id},
            data: updateTaskDto,
        });

        await this.syncTaskPostgisLocation(updatedTask.id, updateTaskDto)

        return this.database.task.findUniqueOrThrow({
            where: {id: task.id}
        })
    }

    async delete(taskId: number, accessWhere: Prisma.TaskWhereInput): Promise<boolean> {
        const task = await this.findOneById(taskId, accessWhere);

        if (!task) return false;

        await this.database.task.delete({
            where: {
                id: task.id,
            },
        });

        return true;
    }

    private hasCoordinates(coordinates: TaskCoordinates) {
        return coordinates.latitude !== undefined && coordinates.longitude !== undefined;
    }

    private async syncTaskPostgisLocation(
        taskId: number,
        coordinates: TaskCoordinates
    ): Promise<void> {
        const {latitude, longitude} = coordinates;

        if (!this.hasCoordinates(coordinates)) return;

        await this.database.$executeRaw`
            UPDATE "tasks"
            SET "location" = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
            WHERE "id" = ${taskId}`;
    }
}
