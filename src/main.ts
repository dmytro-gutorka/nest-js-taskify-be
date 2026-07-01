import type { NestExpressApplication } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

// @gutnidev rbac импортирует DSL validator, а abac зависит от RbacService. Не плоди циклы.
// все RolePermissionsWithRules должны собираться один раз при запросе, а не каждый раз, когда ты хочешь собрать Where

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );

    app.use(cookieParser());

    const config = app.get(ConfigService);

    app.enableCors({
        origin: config.get<string>('APP_FRONTEND_URL') ?? 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    const port = config.get<number>('APP_PORT') ?? 3001;
    await app.listen(port);
}

await bootstrap();
