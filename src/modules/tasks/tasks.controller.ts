import {Controller, Delete, Get, HttpCode, Patch, Post, UseGuards} from '@nestjs/common';
import {CursorPaginationSchema, ParamsIdSchema, type ParamId} from '@common/schemas';
import {ZodQuery, ZodParam, ZodBody} from '@common/decorators';
import type {
    TaskFindAllQuery,
    TaskCursorQuery,
    CreateTaskDto,
    UpdateTaskDto,
} from './task.types.js';
import {TasksService} from './services/tasks.service.js';
import {TaskQuerySchema} from './schemas/task-query.schema.js';
import {CreateTaskSchema} from './schemas/create-task.schema.js';
import {UpdateTaskSchema} from './schemas/update-task.schema.js';
import type {ActiveUser} from '../../common/index.js';
import {CurrentUser} from '../auth/decorators/current-user.decorator.js';
import {AccessTokenGuard} from "../auth/guards/access-token.guard.js";


@Controller('tasks')
@UseGuards(AccessTokenGuard)
export class TasksController {
    constructor(private readonly tasksService: TasksService) {
    }

    @Get()
    findAll(@CurrentUser() user: ActiveUser, @ZodQuery(TaskQuerySchema) query: TaskFindAllQuery) {
        return this.tasksService.findAll(user.id, query);
    }

    @Get('feed')
    findFeed(
        @CurrentUser() user: ActiveUser,
        @ZodQuery(CursorPaginationSchema)
        query: TaskCursorQuery,
    ) {
        return this.tasksService.findFeed(user.id, query);
    }

    @Get(':id')
    findOne(
        @CurrentUser() user: ActiveUser,
        @ZodParam(ParamsIdSchema)
        params: ParamId,
    ) {
        return this.tasksService.findOne(params.id, user.id);
    }

    @Post()
    create(
        @CurrentUser() user: ActiveUser,
        @ZodBody(CreateTaskSchema)
        body: CreateTaskDto,
    ) {
        return this.tasksService.create(body, user.id);
    }

    @Patch(':id')
    update(
        @CurrentUser() user: ActiveUser,
        @ZodBody(UpdateTaskSchema)
        @ZodParam(ParamsIdSchema)
        body: UpdateTaskDto,
        params: ParamId,
    ) {
        return this.tasksService.update(params.id, user.id, body);
    }

    @Delete(':id')
    @HttpCode(200)
    delete(
        @CurrentUser() user: ActiveUser,
        @ZodParam(ParamsIdSchema)
        params: ParamId,
    ) {
        return this.tasksService.delete(params.id, user.id);
    }
}
