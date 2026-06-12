import type { ExceptionFilter } from '@nestjs/common';

export interface AppExceptionHandlersState {
    handler: ExceptionFilter;
    type: any;
}

export interface ErrorResponseDto {
    message: string;
    statusCode: number;
    error: string;
}
