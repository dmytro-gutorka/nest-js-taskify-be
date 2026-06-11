import type { Response } from 'express';
import {
  type ArgumentsHost,
  type ExceptionFilter,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { ErrorResponseDto } from '../types.js';

@Injectable()
export class UnknownExceptionHandler implements ExceptionFilter {
  catch(_exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const errorResponse: ErrorResponseDto = {
      message: 'Internal Server Error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Unknown Error',
    };

    response.status(errorResponse.statusCode).json(errorResponse);
  }
}
