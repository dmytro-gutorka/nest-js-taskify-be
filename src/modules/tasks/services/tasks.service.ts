import { Injectable, NotFoundException } from '@nestjs/common';
import { TasksRepository } from '../repositories/tasks.repository.js';
import { TasksCacheService } from './tasks-cache.service.js';
import type { TaskCursorPaginatedResponse, TaskEntity, TaskResponse } from '../tasks.types.js';
import { CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination-query.dto.js';
import { TaskQueryDto } from '../dto/task-query.dto.js';
import { CreateTaskDto } from '../dto/create-task.dto.js';
import { UpdateTaskDto } from '../dto/update-task.dto.js';
import { PagePaginatedResponse } from '../../../common/types/common.types.js';
import { mapToTaskResponse } from '../mappers/task-response.mapper.js';

@Injectable()
export class TasksService {
    constructor(
        private readonly tasksRepository: TasksRepository,
        private readonly tasksCacheService: TasksCacheService,
    ) {}

    async findAll(userId: number, query: TaskQueryDto): Promise<PagePaginatedResponse<TaskEntity>> {
        return this.tasksRepository.findAll(userId, query);
    }

    async findFeed(
        userId: number,
        query: CursorPaginationQueryDto,
    ): Promise<TaskCursorPaginatedResponse<TaskEntity>> {
        return this.tasksRepository.findFeed(userId, query);
    }

    async findOneById(taskId: number, userId: number): Promise<TaskResponse> {
        const cachedTask = await this.tasksCacheService.getTask(taskId);

        if (cachedTask) return cachedTask;

        const task = await this.tasksRepository.findOneById(taskId, userId);

        if (!task) {
            throw new NotFoundException('Task not found');
        }

        const response = mapToTaskResponse(task);

        await this.tasksCacheService.setTask(taskId, response);

        return response;
    }

    async create(userId: number, dto: CreateTaskDto): Promise<TaskResponse> {
        const task = await this.tasksRepository.create(dto, userId);

        const response = mapToTaskResponse(task);

        await this.tasksCacheService.setTask(task.id, response);

        return response;
    }

    async update(taskId: number, id: number, dto: UpdateTaskDto): Promise<TaskResponse> {
        const task = await this.tasksRepository.findOneById(taskId);

        if (!task) throw new NotFoundException('Task not found');

        const updatedTask = await this.tasksRepository.update(taskId, dto);

        if (!updatedTask) throw new NotFoundException('Task not found');

        const response = mapToTaskResponse(updatedTask);

        await this.tasksCacheService.setTask(id, response);

        return response;
    }

    async delete(id: number): Promise<void> {
        const task = await this.tasksRepository.findOneById(id);

        if (!task) {
            throw new NotFoundException('Task not found');
        }

        await this.tasksRepository.delete(id);
        await this.tasksCacheService.invalidateTask(id);
    }
}
