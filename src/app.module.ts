import {Module} from '@nestjs/common';
import {ConfigService, ConfigModule} from '@nestjs/config';
import {DatabaseModule} from '@database';
import {UsersModule} from '@users';
import {TasksModule} from '@tasks';
import {AuthModule} from "./modules/auth/auth.module.js";
import {ExceptionFilterModule} from "./common/exception-filter/index.js";
import {NotificationModule} from "./modules/notification/notification.module.js";
import {BullModule} from "@nestjs/bullmq";

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.env',
        }),

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
        ExceptionFilterModule,
        NotificationModule,
        AuthModule,
        UsersModule,
        TasksModule,
    ],
})
export class AppModule {
}