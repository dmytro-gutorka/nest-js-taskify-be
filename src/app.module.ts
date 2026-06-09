import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './infrastructure/prisma/prisma.module.js';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { TasksModule } from './modules/tasks/tasks.module.js';

@Module({
    imports: [
        PrismaModule,
        ConfigModule.forRoot({
            envFilePath: '.env',
        }),
        TasksModule,
    ],
    controllers: [AppController],
    providers: [AppService, ConfigService],
})
export class AppModule {}
