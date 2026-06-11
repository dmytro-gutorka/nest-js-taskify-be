import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './all-exceptions.filter.js';
import { HttpExceptionHandler } from './handlers/http-exception.handler.js';
import { PrismaClientExceptionHandler } from './handlers/prisma-client-exception.handler.js';
import { UnknownExceptionHandler } from './handlers/unknown-exception.handler.js';

@Module({
  providers: [
    HttpExceptionHandler,
    UnknownExceptionHandler,
    PrismaClientExceptionHandler,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class ExceptionFilterModule {}
