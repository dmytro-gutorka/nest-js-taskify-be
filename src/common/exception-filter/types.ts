import type { ExceptionFilter } from '@nestjs/common';

export interface AppExceptionHandlersState {
  handler: ExceptionFilter;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type: any;
}

export interface ErrorResponseDto {
  message: string;
  statusCode: number;
  error: string;
}
