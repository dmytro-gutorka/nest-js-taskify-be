import { Injectable, NotFoundException } from '@nestjs/common';
import { TasksRepository } from '../repositories/tasks.repository.js';
import type { MessageResponse } from '@common/types';
import type {
    TaskFindAllQuery,
    TaskPagePaginatedResponse,
    TaskCursorQuery,
    TaskCursorPaginatedResponse,
    TaskResponse,
    CreateTaskDto,
    UpdateTaskDto,
    TaskEntity,
} from '../task.types.js';
import { TaskStatusApiMap, TaskPriorityApiMap } from '../tasks.constants.js';

@Injectable()
export class TasksService {
    constructor(private readonly tasksRepository: TasksRepository) {}

    async findAll(
        userId: number,
        query: TaskFindAllQuery,
    ): Promise<TaskPagePaginatedResponse<TaskResponse>> {
        const paginatedTasksResponse = await this.tasksRepository.findAll(userId, query);
        const mappedTask = paginatedTasksResponse.items.map((task: TaskEntity) =>
            this.toTaskResponse(task),
        );

        return {
            ...paginatedTasksResponse,
            items: mappedTask,
        };
    }

    async findFeed(
        userId: number,
        query: TaskCursorQuery,
    ): Promise<TaskCursorPaginatedResponse<TaskResponse>> {
        const cursorPaginatedTasksResponse = await this.tasksRepository.findFeed(userId, query);
        const mappedTask = cursorPaginatedTasksResponse.items.map((task: TaskEntity) =>
            this.toTaskResponse(task),
        );

        return {
            ...cursorPaginatedTasksResponse,
            items: mappedTask,
        };
    }

    async findOne(taskId: number, userId: number): Promise<TaskResponse> {
        const task = await this.tasksRepository.findOne(taskId, userId);

        if (!task) {
            throw new NotFoundException('Task not found.');
        }

        return this.toTaskResponse(task);
    }

    async create(createTaskDto: CreateTaskDto, userId: number): Promise<TaskResponse> {
        const createdTask = await this.tasksRepository.create(createTaskDto, userId);

        return this.toTaskResponse(createdTask);
    }

    async update(
        taskId: number,
        userId: number,
        updateTaskDto: UpdateTaskDto,
    ): Promise<TaskResponse> {
        const updatedTask = await this.tasksRepository.update(taskId, updateTaskDto, userId);

        if (!updatedTask) {
            throw new NotFoundException('Task not found.');
        }

        return this.toTaskResponse(updatedTask);
    }

    async delete(taskId: number, userId: number): Promise<MessageResponse> {
        const isDeleted = await this.tasksRepository.delete(taskId, userId);

        if (!isDeleted) {
            throw new NotFoundException('Task not found.');
        }

        return {
            message: 'Task deleted successfully',
        };
    }

    toTaskResponse(task: TaskEntity): TaskResponse {
        return {
            ...task,
            status: TaskStatusApiMap[task.status],
            priority: TaskPriorityApiMap[task.priority],
        };
    }
}
