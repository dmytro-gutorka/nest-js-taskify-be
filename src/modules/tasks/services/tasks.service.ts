import { Injectable, NotFoundException } from '@nestjs/common';
import { TasksRepository } from '../repositories/tasks.repository.js';
import type { ActiveUser } from '@common/types';
import type { MessageResponse } from '@common/types';
import type {
    TaskFindAllQuery,
    TaskPagePaginatedResponse,
    TaskCursorQuery,
    TaskCursorPaginatedResponse, TaskResponse, CreateTaskDto, UpdateTaskDto
} from "../task.types.js";

@Injectable()
export class TasksService {
    constructor(private readonly tasksRepository: TasksRepository) {}

    async findAll(user: ActiveUser, query: TaskFindAllQuery): Promise<TaskPagePaginatedResponse> {
        return this.tasksRepository.findAll(user.id, query);
    }

    async findFeed(user: ActiveUser, query: TaskCursorQuery): Promise<TaskCursorPaginatedResponse> {
        return this.tasksRepository.findFeed(user.id, query);
    }

    async findOne(id: number, user: ActiveUser): Promise<TaskResponse> {
        const task = await this.tasksRepository.findOne(id, user.id);

        if (!task) {
            throw new NotFoundException('Task not found.');
        }

        return task;
    }

    async create(createTaskDto: CreateTaskDto, user: ActiveUser): Promise<TaskResponse> {
        return this.tasksRepository.create(createTaskDto, user.id);
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

        return updatedTask;
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
}
