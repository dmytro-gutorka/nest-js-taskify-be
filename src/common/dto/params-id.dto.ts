import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class ParamsIdDto {
    @Type(() => Number)
    @IsInt({ message: `'id' should be an integer` })
    @Min(1, { message: `'id' should be positive` })
    id!: number;
}
