import { Injectable, NotFoundException } from '@nestjs/common';
import { TasksRepository } from '../repositories/tasks.repository.js';
import { TasksCacheService } from './tasks-cache.service.js';
import type { TaskCursorPaginatedResponse, TaskEntity } from '../tasks.types.js';
import { CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination-query.dto.js';
import { TaskQueryDto } from '../dto/task-query.dto.js';
import { CreateTaskDto } from '../dto/create-task.dto.js';
import { UpdateTaskDto } from '../dto/update-task.dto.js';
import { MessageResponse } from '../../../common/types/responses.types.js';
import { PagePaginatedResponse } from '../../../common/types/common.types.js';

@Injectable()
export class TasksService {
    constructor(
        private readonly tasksRepository: TasksRepository,
        private readonly tasksCacheService: TasksCacheService,
    ) {}

    async findAll(userId: number, query: TaskQueryDto): Promise<PagePaginatedResponse<TaskEntity>> {
        return this.tasksCacheService.findAll(userId, query);
    }

    async findFeed(
        userId: number,
        query: CursorPaginationQueryDto,
    ): Promise<TaskCursorPaginatedResponse<TaskEntity>> {
        return this.tasksCacheService.findFeed(userId, query);
    }

    async findOne(taskId: number, userId: number): Promise<TaskEntity> {
        const task = await this.tasksCacheService.findOne(taskId, userId);

        if (!task) throw new NotFoundException('Task not found.');

        return task;
    }

    async create(createTaskDto: CreateTaskDto, userId: number): Promise<TaskEntity> {
        const task = await this.tasksRepository.create(createTaskDto, userId);

        await this.tasksCacheService.invalidateListsOnly(userId);

        return task;
    }

    async update(
        taskId: number,
        userId: number,
        updateTaskDto: UpdateTaskDto,
    ): Promise<TaskEntity> {
        const updatedTask = await this.tasksRepository.update(taskId, updateTaskDto, userId);

        if (!updatedTask) throw new NotFoundException('Task not found.');

        await this.tasksCacheService.invalidateAfterWrite(taskId, userId);

        return updatedTask;
    }

    async delete(taskId: number, userId: number): Promise<MessageResponse> {
        const isDeleted = await this.tasksRepository.delete(taskId, userId);

        if (!isDeleted) throw new NotFoundException('Task not found.');

        await this.tasksCacheService.invalidateAfterWrite(taskId, userId);

        return { message: 'Task deleted successfully' };
    }
}
