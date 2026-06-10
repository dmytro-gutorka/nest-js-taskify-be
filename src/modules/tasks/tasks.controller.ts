import { Controller, Delete, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { CursorPaginationSchema, ParamsIdSchema, type ParamId } from '@common/schemas';
import { AuthProvider } from '@database/client';
import { ZodQuery, ZodParam, ZodBody } from '@common/decorators';
import type { ActiveUser } from '@common/types';
import type {
    TaskFindAllQuery,
    TaskCursorQuery,
    CreateTaskDto,
    UpdateTaskDto,
} from './task.types.js';
import { TasksService } from './services/tasks.service.js';
import { TaskQuerySchema } from './schemas/task-query.schema.js';
import { CreateTaskSchema } from './schemas/create-task.schema.js';
import { UpdateTaskSchema } from './schemas/update-task.schema.js';

@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    private readonly temporaryUser: ActiveUser = {
        id: 1,
        email: 'test@example.com',
        provider: AuthProvider.LOCAL,
    };

    @Get()
    findAll(
        // @ts-ignore
        // I do not know how to fix this for now, TODO: 1 figure out later
        @ZodQuery(CursorPaginationSchema)
        query: TaskFindAllQuery,
    ) {
        return this.tasksService.findAll(this.temporaryUser, query);
    }

    @Get('feed')
    findFeed(
        @ZodQuery(TaskQuerySchema)
        query: TaskCursorQuery,
    ) {
        return this.tasksService.findFeed(this.temporaryUser, query);
    }

    @Get(':id')
    findOne(
        @ZodParam(ParamsIdSchema)
        params: ParamId,
    ) {
        return this.tasksService.findOne(params.id, this.temporaryUser);
    }

    @Post()
    create(
        @ZodBody(CreateTaskSchema)
        body: CreateTaskDto,
    ) {
        return this.tasksService.create(body, this.temporaryUser);
    }

    @Patch(':id')
    update(
        @ZodBody(UpdateTaskSchema)
        @ZodParam(ParamsIdSchema)
        body: UpdateTaskDto,
        params: ParamId,
    ) {
        return this.tasksService.update(params.id, body, this.temporaryUser);
    }

    @Delete(':id')
    @HttpCode(200)
    delete(
        @ZodParam(ParamsIdSchema)
        params: ParamId,
    ) {
        return this.tasksService.delete(params.id, this.temporaryUser);
    }
}
