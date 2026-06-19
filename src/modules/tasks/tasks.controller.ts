import { Controller, Delete, Get, HttpCode, Patch, Post, Query, Body, Param } from '@nestjs/common';
import type { TaskEntity } from './tasks.types.js';
import { TasksService } from './services/tasks.service.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { mapToTaskResponse } from './mappers/task-response.mapper.js';
import { type ActiveUser } from '../../common/types/common.types.js';
import { TaskQueryDto } from './dto/task-query.dto.js';
import { CursorPaginationQueryDto } from '../../common/dto/cursor-pagination-query.dto.js';
import { ParamsIdDto } from '../../common/dto/params-id.dto.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { RequiredPermissions } from '../rbac/index.js';

@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) {}

    @Get()
    @RequiredPermissions('TASKS:READ')
    async findAll(@CurrentUser() user: ActiveUser, @Query() query: TaskQueryDto) {
        const paginatedTasks = await this.tasksService.findAll(user.id, query);
        const mappedTasks = paginatedTasks.items.map((task: TaskEntity) => mapToTaskResponse(task));

        return {
            ...paginatedTasks,
            items: mappedTasks,
        };
    }

    @Get('feed')
    @RequiredPermissions('TASKS:READ')
    async findFeed(@CurrentUser() user: ActiveUser, @Query() query: CursorPaginationQueryDto) {
        const cursorPaginatedTasks = await this.tasksService.findFeed(user.id, query);
        const mappedTasks = cursorPaginatedTasks.items.map((task: TaskEntity) =>
            mapToTaskResponse(task),
        );

        return {
            ...cursorPaginatedTasks,
            items: mappedTasks,
        };
    }

    @Get(':id')
    @RequiredPermissions('TASKS:READ')
    async findOne(@CurrentUser() user: ActiveUser, @Param() params: ParamsIdDto) {
        return await this.tasksService.findOneById(params.id, user.id);
    }

    @Post()
    @RequiredPermissions('TASKS:CREATE')
    async create(@CurrentUser() user: ActiveUser, @Body() body: CreateTaskDto) {
        return await this.tasksService.create(user.id, body);
    }

    @Patch(':id')
    @RequiredPermissions('TASKS:UPDATE')
    async update(
        @CurrentUser() user: ActiveUser,
        @Param() params: ParamsIdDto,
        @Body() body: UpdateTaskDto,
    ) {
        return await this.tasksService.update(params.id, user.id, body);
    }

    @Delete(':id')
    @HttpCode(200)
    @RequiredPermissions('TASKS:DELETE')
    delete(@CurrentUser() user: ActiveUser, @Param() params: ParamsIdDto) {
        return this.tasksService.delete(params.id);
    }
}
