import { Injectable, NotFoundException } from '@nestjs/common';
import { TasksRepository } from '../repositories/tasks.repository.js';
import type { ActiveUser } from '@common/types';
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
        user: ActiveUser,
        query: TaskFindAllQuery,
    ): Promise<TaskPagePaginatedResponse<TaskResponse>> {
        const paginatedTasksResponse = await this.tasksRepository.findAll(user.id, query);
        const mappedTask = paginatedTasksResponse.items.map((task: TaskEntity) =>
            this.toTaskResponse(task),
        );

        return {
            ...paginatedTasksResponse,
            items: mappedTask,
        };
    }

    async findFeed(
        user: ActiveUser,
        query: TaskCursorQuery,
    ): Promise<TaskCursorPaginatedResponse<TaskResponse>> {
        const cursorPaginatedTasksResponse = await this.tasksRepository.findFeed(user.id, query);
        const mappedTask = cursorPaginatedTasksResponse.items.map((task: TaskEntity) =>
            this.toTaskResponse(task),
        );

        return {
            ...cursorPaginatedTasksResponse,
            items: mappedTask,
        };
    }

    async findOne(id: number, user: ActiveUser): Promise<TaskResponse> {
        const task = await this.tasksRepository.findOne(id, user.id);

        if (!task) {
            throw new NotFoundException('Task not found.');
        }

        return this.toTaskResponse(task);
    }

    async create(createTaskDto: CreateTaskDto, user: ActiveUser): Promise<TaskResponse> {
        const createdTask = await this.tasksRepository.create(createTaskDto, user.id);

        return this.toTaskResponse(createdTask);
    }

    async update(
        id: number,
        updateTaskDto: UpdateTaskDto,
        user: ActiveUser,
    ): Promise<TaskResponse> {
        const updatedTask = await this.tasksRepository.update(id, updateTaskDto, user.id);

        if (!updatedTask) {
            throw new NotFoundException('Task not found.');
        }

        return this.toTaskResponse(updatedTask);
    }

    async delete(id: number, user: ActiveUser): Promise<MessageResponse> {
        const isDeleted = await this.tasksRepository.delete(id, user.id);

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
