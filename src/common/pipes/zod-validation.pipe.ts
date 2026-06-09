import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { z } from 'zod';

@Injectable()
export class ZodValidationPipe<TSchema extends z.ZodTypeAny> implements PipeTransform {
    constructor(private readonly schema: TSchema) {}

    transform(value: unknown): z.infer<TSchema> {
        const result = this.schema.safeParse(value);

        if (!result.success) {
            throw new BadRequestException({
                message: 'Validation failed',
                errors: result.error.issues.map((issue) => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code,
                })),
            });
        }

        return result.data;
    }
}
