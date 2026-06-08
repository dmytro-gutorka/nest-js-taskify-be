import {Module} from '@nestjs/common';
import {AppController} from './app.controller.js';
import {AppService} from './app.service.js';
import {PrismaModule} from "./infrastructure/prisma/prisma.module.js";
import {ConfigService, ConfigModule} from "@nestjs/config";

@Module({
    imports: [
        PrismaModule,
        ConfigModule.forRoot({
            envFilePath: '.env',
        })
    ],
    controllers: [AppController],
    providers: [AppService, ConfigService
    ],
})
export class AppModule {
}
