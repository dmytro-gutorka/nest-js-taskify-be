import { Injectable, NotFoundException } from '@nestjs/common';
import { TasksRepository } from '../repositories/tasks.repository.js';
import { TasksCacheService } from './tasks-cache.service.js';
import type { TaskCursorPaginatedResponse, TaskEntity, TaskResponse } from '../tasks.types.js';
import { CursorPaginationQueryDto } from '../../../common/dto/cursor-pagination-query.dto.js';
import { TaskQueryDto } from '../dto/task-query.dto.js';
import { CreateTaskDto } from '../dto/create-task.dto.js';
import { UpdateTaskDto } from '../dto/update-task.dto.js';
import { PagePaginatedResponse, ActiveUser } from '../../../common/types/common.types.js';
import { mapToTaskResponse } from '../mappers/task-response.mapper.js';
import { AbacService } from '../../abac/index.js';
// @gutnidev у тебя есть @database/client
import { Prisma } from '../../../infrastructure/database/prisma/generated/client.js';

@Injectable()
export class TasksService {
    constructor(
        private readonly tasksRepository: TasksRepository,
        private readonly tasksCacheService: TasksCacheService,
        private readonly abacService: AbacService,
    ) {}

    async findAll(
        user: ActiveUser,
        query: TaskQueryDto,
    ): Promise<PagePaginatedResponse<TaskEntity>> {
        const accessWhere = (await this.abacService.buildWhereOrThrow(user, 'TASKS:READ',));

        return this.tasksRepository.findAll(accessWhere, query);
    }

    async findFeed(
        userId: number,
        query: CursorPaginationQueryDto,
    ): Promise<TaskCursorPaginatedResponse<TaskEntity>> {
        return this.tasksRepository.findFeed(userId, query);
    }

    async findOneById(taskId: number, user: ActiveUser): Promise<TaskResponse> {
        // @gutnidev не забудь раскомментить когда протестируешь
        // и тут будь внимателен с кэшом. У тебя проверка ABAC идёт после того, как ты кэш отдаёшь пользователю.
        // можешь отдать не тому юзеру не те данные

        // const cachedTask = await this.tasksCacheService.getTask(taskId);
        //
        // if (cachedTask) return cachedTask;
        // Temporary off for testing purposes

        const accessWhere = await this.abacService.buildWhereOrThrow(user, 'TASKS:READ');

        const task = await this.tasksRepository.findOneById(taskId, accessWhere);

        if (!task) throw new NotFoundException('Task not found');

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

    async update(taskId: number, user: ActiveUser, dto: UpdateTaskDto): Promise<TaskResponse> {
        const accessWhere = (await this.abacService.buildWhereOrThrow(
            user,
            'TASKS:UPDATE',
        )) as Prisma.TaskWhereInput;

        // @gutnidev у тебя тут findOneById дальше идёт update в котором тоже findOneById
        const task = await this.tasksRepository.findOneById(taskId, accessWhere);
        if (!task) throw new NotFoundException('Task not found');

        const updatedTask = await this.tasksRepository.update(taskId, accessWhere, dto);
        if (!updatedTask) throw new NotFoundException('Task not found');

        const response = mapToTaskResponse(updatedTask);
        await this.tasksCacheService.setTask(taskId, response);

        return response;
    }

    async delete(taskId: number, user: ActiveUser): Promise<void> {
        const accessWhere = (await this.abacService.buildWhereOrThrow(
            user,
            'TASKS:DELETE',
        )) as Prisma.TaskWhereInput;

        // @gutnidev у тебя тут findOneById дальше идёт delete в котором тоже findOneById
        const task = await this.tasksRepository.findOneById(taskId, accessWhere);

        if (!task) {
            throw new NotFoundException('Task not found');
        }

        await this.tasksRepository.delete(taskId, accessWhere);
        await this.tasksCacheService.invalidateTask(taskId);
    }
}
