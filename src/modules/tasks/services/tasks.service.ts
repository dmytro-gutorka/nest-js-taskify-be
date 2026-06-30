import {Injectable, NotFoundException} from '@nestjs/common';
import {TasksRepository} from '../repositories/tasks.repository.js';
import {TasksCacheService} from './tasks-cache.service.js';
import type {TaskCursorPaginatedResponse, TaskEntity, TaskResponse, TaskMapItemResponse} from '../tasks.types.js';
import {CursorPaginationQueryDto} from '../../../common/dto/cursor-pagination-query.dto.js';
import {TaskQueryDto} from '../dto/task-query.dto.js';
import {CreateTaskDto} from '../dto/create-task.dto.js';
import {UpdateTaskDto} from '../dto/update-task.dto.js';
import {PagePaginatedResponse, ActiveUser} from '../../../common/types/common.types.js';
import {mapToTaskResponse, mapToTaskMapItemResponse} from '../mappers/task-response.mapper.js';
import {AbacService} from '../../abac/index.js';
import {Prisma} from '../../../infrastructure/database/prisma/generated/client.js';
import {TaskMapQueryDto} from "../dto/task-map-query.dto.js";

@Injectable()
export class TasksService {
    constructor(
        private readonly tasksRepository: TasksRepository,
        private readonly tasksCacheService: TasksCacheService,
        private readonly abacService: AbacService,
    ) {
    }

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
        // const cachedTask = await this.tasksCacheService.getTask(taskId);
        //
        // if (cachedTask) return cachedTask;
        // Temporary off for testing purposes

        const accessWhere = (await this.abacService.buildWhereOrThrow(user, 'TASKS:READ'))

        const task = await this.tasksRepository.findOneById(taskId, accessWhere);

        if (!task) throw new NotFoundException('Task not found');

        const response = mapToTaskResponse(task);

        await this.tasksCacheService.setTask(taskId, response);

        return response;
    }

    async findMapTasks(
        user: ActiveUser,
        query: TaskMapQueryDto,
    ): Promise<TaskMapItemResponse[]> {
        const accessWhere = await this.abacService.buildWhereOrThrow(user, 'TASKS:READ') as Prisma.TaskWhereInput

        const tasks = await this.tasksRepository.findMapTasks(accessWhere, query);

        return tasks.map((task) => mapToTaskMapItemResponse(task));
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

        const task = await this.tasksRepository.findOneById(taskId, accessWhere);

        if (!task) {
            throw new NotFoundException('Task not found');
        }

        await this.tasksRepository.delete(taskId, accessWhere);
        await this.tasksCacheService.invalidateTask(taskId);
    }
}
