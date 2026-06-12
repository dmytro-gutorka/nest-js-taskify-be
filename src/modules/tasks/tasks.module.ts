import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './services/tasks.service.js';
import { TasksRepository } from './repositories/tasks.repository.js';
import { AuthCoreModule } from '../auth/auth-core.module.js';

@Module({
    imports: [AuthCoreModule],
    controllers: [TasksController],
    providers: [TasksService, TasksRepository],
})
export class TasksModule {}
