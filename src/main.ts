import 'module-alias/register'
import {NestFactory} from '@nestjs/core';
import type {NestExpressApplication} from '@nestjs/platform-express';
import {AppModule} from './app.module.js';
import {ConfigService} from '@nestjs/config';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    const config = app.get(ConfigService);
    const port = config.get<number>('APP_PORT') ?? 3001;
    await app.listen(port);
}

bootstrap();
