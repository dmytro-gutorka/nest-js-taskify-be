import type { Response } from 'express';
import {
  BadRequestException,
  ConflictException,
  type ArgumentsHost,
  type ExceptionFilter,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma} from '@database/client';
import type { ErrorResponseDto } from '../types.js';
import { UnknownExceptionHandler } from './unknown-exception.handler.js';

@Injectable()
export class PrismaClientExceptionHandler
  implements ExceptionFilter<Prisma.PrismaClientKnownRequestError>
{
  constructor(private readonly unknownExceptionHandler: UnknownExceptionHandler) {}

  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const httpException = this.toHttpException(exception);

    if (!httpException) {
      this.unknownExceptionHandler.catch(exception, host);
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const statusCode = httpException.getStatus();

    const errorResponse: ErrorResponseDto = {
      message: httpException.message,
      statusCode,
      error: httpException.name,
    };

    response.status(statusCode).json(errorResponse);
  }

  private toHttpException(
    exception: Prisma.PrismaClientKnownRequestError,
  ) {
    switch (exception.code) {
      case 'P2002':
        return new ConflictException(this.getUniqueConstraintMessage(exception));

      case 'P2003':
        return new BadRequestException('Foreign key constraint failed');

      case 'P2025':
        return new NotFoundException('Record not found');

      case 'P2000':
        return new BadRequestException('Value is too long for the column');

      case 'P2011':
        return new BadRequestException('Null constraint violation');

      case 'P2012':
        return new BadRequestException('Missing required value');

      default:
        return null;
    }
  }

  private getUniqueConstraintMessage(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string {
    const target = exception.meta?.target;

    if (Array.isArray(target) && target.length > 0) {
      return `${target.join(', ')} already exists`;
    }

    return 'Unique constraint failed';
  }
}
