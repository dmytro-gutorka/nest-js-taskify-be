import { Module } from '@nestjs/common';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@database';
import { UsersModule } from '@users';
import { TasksModule } from '@tasks';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.env',
        }),
        TasksModule,
        UsersModule,
        DatabaseModule,
    ],
    controllers: [],
    providers: [ConfigService],
})
export class AppModule {}
