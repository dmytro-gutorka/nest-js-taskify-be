import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { emptyToUndefined } from '../utils/converters.utils.js';

export class CursorPaginationQueryDto {
    @Transform(emptyToUndefined)
    @Type(() => Number)
    @IsOptional()
    @IsInt({ message: `'cursor' should be an integer` })
    @Min(1, { message: `'cursor' should be positive` })
    cursor?: number;

    @Transform(emptyToUndefined)
    @Type(() => Number)
    @IsOptional()
    @IsInt({ message: `'limit' should be an integer` })
    @Min(1, { message: `Min 'limit' value is 1` })
    @Max(50, { message: `Max 'limit' value is 50` })
    limit: number = 10;
}
