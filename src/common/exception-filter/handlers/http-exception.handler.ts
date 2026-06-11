import type { Response } from 'express';
import {
  type ArgumentsHost,
  type ExceptionFilter,
  type HttpException,
  Injectable,
} from '@nestjs/common';

@Injectable()
export class HttpExceptionHandler implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(exception.getStatus()).send(exception.getResponse());
  }
}
