import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException } from '@nestjs/common';
import { Prisma } from '@database/client';
import type { AppExceptionHandlersState } from './types.js';
import { HttpExceptionHandler } from './handlers/http-exception.handler.js';
import { PrismaClientExceptionHandler } from './handlers/prisma-client-exception.handler.js';
import { UnknownExceptionHandler } from './handlers/unknown-exception.handler.js';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly exceptionHandlers: AppExceptionHandlersState[] = [];

    constructor(
        private readonly httpExceptionHandler: HttpExceptionHandler,
        private readonly unknownExceptionHandler: UnknownExceptionHandler,
        private readonly prismaClientExceptionHandler: PrismaClientExceptionHandler,
    ) {
        this.registerHandler(HttpException, this.httpExceptionHandler);
        this.registerHandler(
            Prisma.PrismaClientKnownRequestError,
            this.prismaClientExceptionHandler,
        );
    }

    catch(exception: unknown, host: ArgumentsHost): void {
        console.error(exception);

        const candidate = this.exceptionHandlers.find(({ type }) => exception instanceof type);

        if (candidate) {
            candidate.handler.catch(exception, host);
            return;
        }

        this.unknownExceptionHandler.catch(exception, host);
    }

    private registerHandler(type: unknown, handler: ExceptionFilter): void {
        this.exceptionHandlers.push({
            type,
            handler,
        });
    }
}
