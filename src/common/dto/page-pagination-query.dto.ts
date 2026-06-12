import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { emptyToUndefined } from '../utils/converters.utils.js';

export class PagePaginationQueryDto {
    @Transform(emptyToUndefined)
    @Type(() => Number)
    @IsOptional()
    @IsInt({ message: `'page' should be an integer` })
    @Min(1, { message: `Min 'page' value is 1` })
    page: number = 1;

    @Transform(emptyToUndefined)
    @Type(() => Number)
    @IsOptional()
    @IsInt({ message: `'limit' should be an integer` })
    @Min(1, { message: `Min 'limit' value is 1` })
    limit: number = 10;
}
