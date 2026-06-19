import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { PagePaginationQueryDto } from '../../../common/dto/page-pagination-query.dto.js';
import { emptyToUndefined } from '../../../common/utils/converters.utils.js';

export class UsersPageQueryDto extends PagePaginationQueryDto {
    @Transform(emptyToUndefined)
    @IsOptional()
    @IsString()
    @MaxLength(100)
    search?: string;
}
