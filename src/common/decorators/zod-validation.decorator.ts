import type { ZodType } from 'zod';
import { Body, Param, Query } from '@nestjs/common';
import { ZodValidationPipe } from '@common/pipes';

export function ZodBody<T>(schema: ZodType<T>) {
    return Body(new ZodValidationPipe(schema));
}

export function ZodQuery<T>(schema: ZodType<T>) {
    return Query(new ZodValidationPipe(schema));
}

export function ZodParam<T>(schema: ZodType<T>) {
    return Param(new ZodValidationPipe(schema));
}
