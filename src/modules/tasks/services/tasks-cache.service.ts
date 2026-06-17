import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TasksRepository } from '../repositories/tasks.repository.js';
import type { TaskCursorPaginatedResponse, TaskEntity } from '../tasks.types.js';
import { TaskQueryDto } from '../dto/task-query.dto.js';
import { CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination-query.dto.js';
import { CacheService, CacheKeyFactory } from '../../../infrastructure/cache/index.js';
import type { CacheConfig } from '../../../infrastructure/cache/index.js';
import { PagePaginatedResponse } from '../../../common/types/common.types.js';

function reviveTaskDates(task: TaskEntity): TaskEntity {
    return {
        ...task,
        deadline: task.deadline ? new Date(task.deadline) : null,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
    };
}

function reviveTasks<T extends { items: TaskEntity[] }>(response: T): T {
    return { ...response, items: response.items.map(reviveTaskDates) };
}

@Injectable()
export class TasksCacheService {
    private readonly itemTtl: number;
    private readonly listTtl: number;

    constructor(
        private readonly tasksRepository: TasksRepository,
        private readonly cacheService: CacheService,
        private readonly configService: ConfigService,
    ) {
        const config = this.configService.getOrThrow<CacheConfig>('cache');
        this.itemTtl = config.taskItemTtl;
        this.listTtl = config.taskListTtl;
    }

    async findAll(userId: number, query: TaskQueryDto): Promise<PagePaginatedResponse<TaskEntity>> {
        const cacheKey = CacheKeyFactory.taskList(userId, query);

        const cached = await this.cacheService.get<PagePaginatedResponse<TaskEntity>>(cacheKey);
        if (cached) return reviveTasks(cached);

        const result = await this.tasksRepository.findAll(userId, query);

        await this.cacheService.set(cacheKey, result, this.listTtl);

        return result;
    }

    async findFeed(
        userId: number,
        query: CursorPaginationQueryDto,
    ): Promise<TaskCursorPaginatedResponse<TaskEntity>> {
        const cacheKey = CacheKeyFactory.taskFeed(userId, query);

        const cached =
            await this.cacheService.get<TaskCursorPaginatedResponse<TaskEntity>>(cacheKey);
        if (cached) return reviveTasks(cached);

        const result = await this.tasksRepository.findFeed(userId, query);

        await this.cacheService.set(cacheKey, result, this.listTtl);

        return result;
    }

    async findOne(taskId: number, userId: number): Promise<TaskEntity | null> {
        const cacheKey = CacheKeyFactory.taskItem(taskId);

        const cached = await this.cacheService.get<TaskEntity>(cacheKey);
        if (cached) return reviveTaskDates(cached);

        const task = await this.tasksRepository.findOne(taskId, userId);
        if (!task) return null;

        await this.cacheService.set(cacheKey, task, this.itemTtl);

        return task;
    }

    async invalidateAfterWrite(taskId: number, userId: number): Promise<void> {
        await Promise.all([
            this.cacheService.del(CacheKeyFactory.taskItem(taskId)),
            this.cacheService.deleteByPattern(CacheKeyFactory.taskUserListPattern(userId)),
            this.cacheService.deleteByPattern(CacheKeyFactory.taskUserFeedPattern(userId)),
        ]);
    }

    async invalidateListsOnly(userId: number): Promise<void> {
        await Promise.all([
            this.cacheService.deleteByPattern(CacheKeyFactory.taskUserListPattern(userId)),
            this.cacheService.deleteByPattern(CacheKeyFactory.taskUserFeedPattern(userId)),
        ]);
    }
}
