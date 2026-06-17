import { Module } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@database';
import { UsersModule } from '@users';
import { TasksModule } from '@tasks';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { ExceptionFilterModule } from './common/exception-filter/exception-filter.module.js';
import { NotificationModule } from './modules/notification/index.js';
import { AuthModule } from './modules/auth/index.js';
import { RbacModule } from './modules/rbac/index.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { CacheModule } from './infrastructure/cache/index.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.env',
        }),
        ScheduleModule.forRoot(),
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                connection: {
                    host: configService.getOrThrow<string>('REDIS_HOST'),
                    port: configService.getOrThrow<number>('REDIS_PORT'),
                },
            }),
        }),
        DatabaseModule,
        CacheModule,
        ExceptionFilterModule,
        NotificationModule,
        AuthModule,
        UsersModule,
        TasksModule,
        RbacModule,
        AdminModule,
    ],
})
export class AppModule {}
