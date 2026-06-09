import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { TasksService } from './services/tasks.service.js';
import type { ActiveUser } from '../../common/types/auth.types.js';
import { TaskQuerySchema } from './schemas/task-query.schema.js';
import type {
    TaskFindAllQuery,
    TaskCursorQuery,
    CreateTaskDto,
    UpdateTaskDto,
} from './task.types.js';
import { CursorPaginationSchema } from '../../common/schemas/cursor-pagination.schema.js';
import { ParamsIdSchema, type ParamId } from '../../common/schemas/params-id.schema.js';
import { CreateTaskSchema } from './schemas/create-task.schema.js';
import { UpdateTaskSchema } from './schemas/update-task.schema.js';
import { AuthProvider } from '../../generated/prisma/enums.js';

@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    // as I do not have auth service yet, I will use this temporary user.
    // It will be delete it later
    private readonly temporaryUser: ActiveUser = {
        id: 1,
        email: 'test@example.com',
        provider: AuthProvider.LOCAL,
    };

    @Get()
    findAll(
        // @ts-ignore
        // I do not know how to fix this for now, TODO: 1 figure out later
        @Query(new ZodValidationPipe(TaskQuerySchema))
        query: TaskFindAllQuery,
    ) {
        return this.tasksService.findAll(this.temporaryUser, query);
    }

    @Get('feed')
    findFeed(
        @Query(new ZodValidationPipe(CursorPaginationSchema))
        query: TaskCursorQuery,
    ) {
        return this.tasksService.findFeed(this.temporaryUser, query);
    }

    @Get(':id')
    findOne(
        @Param(new ZodValidationPipe(ParamsIdSchema))
        params: ParamId,
    ) {
        return this.tasksService.findOne(params.id, this.temporaryUser);
    }

    @Post()
    create(
        @Body(new ZodValidationPipe(CreateTaskSchema))
        body: CreateTaskDto,
    ) {
        return this.tasksService.create(body, this.temporaryUser);
    }

    @Patch(':id')
    update(
        @Param(new ZodValidationPipe(ParamsIdSchema))
        params: ParamId,
        @Body(new ZodValidationPipe(UpdateTaskSchema))
        body: UpdateTaskDto,
    ) {
        return this.tasksService.update(params.id, body, this.temporaryUser);
    }

    @Delete(':id')
    @HttpCode(200)
    delete(
        @Param(new ZodValidationPipe(ParamsIdSchema))
        params: ParamId,
    ) {
        return this.tasksService.delete(params.id, this.temporaryUser);
    }
}
