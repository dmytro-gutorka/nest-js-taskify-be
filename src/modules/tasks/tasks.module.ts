import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './services/tasks.service.js';
import { TasksCacheService } from './services/tasks-cache.service.js';
import { TasksRepository } from './repositories/tasks.repository.js';
import { AuthCoreModule } from '../auth/auth-core.module.js';
import { CacheModule } from '../../infrastructure/cache/index.js';
import { ConfigModule } from '@nestjs/config';
import { tasksCacheConfig } from './config/tasks-cache.config.js';
@Module({
    // @gutnidev дублируешь импорт ConfigModule
    imports: [AuthCoreModule, CacheModule, ConfigModule, ConfigModule.forFeature(tasksCacheConfig)],
    controllers: [TasksController],
    providers: [TasksRepository, TasksCacheService, TasksService],
})
export class TasksModule {}
