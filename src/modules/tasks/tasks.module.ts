import { TasksController } from './tasks.controller.js';
import { Module } from '@nestjs/common';
import { TasksService } from './services/tasks.service.js';
import { TasksRepository } from './repositories/tasks.repository.js';

@Module({
    controllers: [TasksController],
    providers: [TasksService, TasksRepository],
})
export class TasksModule {}
