import {Controller, Delete, Get, HttpCode, Patch, Post, UseGuards} from '@nestjs/common';
import {CursorPaginationSchema, ParamsIdSchema, type ParamId} from '@common/schemas';
import {ZodQuery, ZodParam, ZodBody} from '@common/decorators';
import type {
    TaskFindAllQuery,
    TaskCursorQuery,
    CreateTaskDto,
    UpdateTaskDto, TaskEntity,
} from './task.types.js';
import {TasksService} from './services/tasks.service.js';
import {TaskQuerySchema} from './schemas/task-query.schema.js';
import {CreateTaskSchema} from './schemas/create-task.schema.js';
import {UpdateTaskSchema} from './schemas/update-task.schema.js';
import type {ActiveUser} from '../../common/index.js';
import {CurrentUser} from '../auth/decorators/current-user.decorator.js';
import {AccessTokenGuard} from "../auth/guards/access-token.guard.js";
import {mapToTaskResponse} from "./mappers/task-response.mapper.js";


@Controller('tasks')
@UseGuards(AccessTokenGuard)
export class TasksController {
    constructor(private readonly tasksService: TasksService) {
    }

    @Get()
    async findAll(@CurrentUser() user: ActiveUser, @ZodQuery(TaskQuerySchema) query: TaskFindAllQuery) {
        const paginatedTasks = await this.tasksService.findAll(user.id, query);
        const mappedTasks = paginatedTasks.items.map((task: TaskEntity) => mapToTaskResponse(task))

        return {
            ...paginatedTasks,
            items: mappedTasks,
        }
    }

    @Get('feed')
    async findFeed(
        @CurrentUser() user: ActiveUser,
        @ZodQuery(CursorPaginationSchema)
        query: TaskCursorQuery,
    ) {
        const cursorPaginatedTasks = await this.tasksService.findFeed(user.id, query);
        const mappedTasks = cursorPaginatedTasks.items.map((task: TaskEntity) => mapToTaskResponse(task))

        return {
            ...cursorPaginatedTasks,
            items: mappedTasks,
        }
    }

    @Get(':id')
    async findOne(
        @CurrentUser() user: ActiveUser,
        @ZodParam(ParamsIdSchema)
        params: ParamId,
    ) {
        return mapToTaskResponse(await this.tasksService.findOne(params.id, user.id))
    }

    @Post()
    async create(
        @CurrentUser() user: ActiveUser,
        @ZodBody(CreateTaskSchema)
        body: CreateTaskDto,
    ) {
        return mapToTaskResponse(await this.tasksService.create(body, user.id))
    }

    @Patch(':id')
    async update(
        @CurrentUser() user: ActiveUser,
        @ZodBody(UpdateTaskSchema)
        body: UpdateTaskDto,
        @ZodParam(ParamsIdSchema)
        params: ParamId,
    ) {
        console.log(params.id, user.id)
        return mapToTaskResponse(await this.tasksService.update(params.id, user.id, body))
    }

    @Delete(':id')
    @HttpCode(200)
    delete(
        @CurrentUser() user: ActiveUser,
        @ZodParam(ParamsIdSchema)
        params: ParamId,
    ) {
        return this.tasksService.delete(params.id, user.id)
    }
}
