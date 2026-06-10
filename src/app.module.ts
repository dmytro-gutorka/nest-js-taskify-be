import { Module } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@database';
import { UsersModule } from '@users';
import { TasksModule } from '@tasks';
import { AuthModule } from './modules/auth/auth.module.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.env',
        }),
        TasksModule,
        UsersModule,
        DatabaseModule,
        AuthModule,
    ],
    controllers: [],
    providers: [ConfigService],
})
export class AppModule {}
