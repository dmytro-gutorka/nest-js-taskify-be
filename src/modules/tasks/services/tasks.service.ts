import {Injectable, NotFoundException} from '@nestjs/common';
import {TasksRepository} from '../repositories/tasks.repository.js';
import type {MessageResponse} from '@common/types';
import type {
    TaskFindAllQuery,
    TaskPagePaginatedResponse,
    TaskCursorQuery,
    TaskCursorPaginatedResponse,
    CreateTaskDto,
    UpdateTaskDto,
    TaskEntity,
} from '../task.types.js';

@Injectable()
export class TasksService {
    constructor(private readonly tasksRepository: TasksRepository) {
    }

    async findAll(
        userId: number,
        query: TaskFindAllQuery,
    ): Promise<TaskPagePaginatedResponse<TaskEntity>> {
        return await this.tasksRepository.findAll(userId, query);
    }

    async findFeed(
        userId: number,
        query: TaskCursorQuery,
    ): Promise<TaskCursorPaginatedResponse<TaskEntity>> {
        return await this.tasksRepository.findFeed(userId, query);
    }

    async findOne(taskId: number, userId: number): Promise<TaskEntity> {
        const task = await this.tasksRepository.findOne(taskId, userId);

        if (!task) throw new NotFoundException('Task not found.');

        return task
    }

    async create(createTaskDto: CreateTaskDto, userId: number): Promise<TaskEntity> {
        return await this.tasksRepository.create(createTaskDto, userId);
    }

    async update(
        taskId: number,
        userId: number,
        updateTaskDto: UpdateTaskDto,
    ): Promise<TaskEntity> {
        const updatedTask = await this.tasksRepository.update(taskId, updateTaskDto, userId);

        if (!updatedTask) throw new NotFoundException('Task not found.');

        return updatedTask
    }

    async delete(taskId: number, userId: number): Promise<MessageResponse> {
        const isDeleted = await this.tasksRepository.delete(taskId, userId);

        if (!isDeleted) throw new NotFoundException('Task not found.');

        return {
            message: 'Task deleted successfully',
        };
    }
}
