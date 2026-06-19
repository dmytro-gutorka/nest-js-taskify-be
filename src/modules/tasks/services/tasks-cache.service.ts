import { Injectable, Inject } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import type { TaskResponse } from '../tasks.types.js';
import { CacheService } from '../../../infrastructure/cache/index.js';
import { tasksCacheConfig } from '../config/tasks-cache.config.js';
import { TasksCacheKeys } from '../cache/tasks-cache-keys.js';

@Injectable()
export class TasksCacheService {
    constructor(
        private readonly cacheService: CacheService,

        @Inject(tasksCacheConfig.KEY)
        private readonly config: ConfigType<typeof tasksCacheConfig>,
    ) {}

    async getTask(taskId: number): Promise<TaskResponse | null> {
        return this.cacheService.get<TaskResponse>(TasksCacheKeys.item(taskId));
    }

    async setTask(taskId: number, task: TaskResponse): Promise<void> {
        await this.cacheService.set(TasksCacheKeys.item(taskId), task, this.config.taskItemTtl);
    }

    async invalidateTask(taskId: number): Promise<void> {
        await this.cacheService.del(TasksCacheKeys.item(taskId));
    }
}
