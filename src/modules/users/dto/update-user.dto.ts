import { Transform } from 'class-transformer';
import { IsDate, IsOptional, IsString, MinLength } from 'class-validator';

const emptyToUndefinedDate = ({ value }: { value: unknown }) => {
    if (value === '' || value === null || value === undefined) return undefined;

    return value instanceof Date ? value : new Date(value as string | number);
};

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    @MinLength(2, { message: 'Min name length is 2' })
    name?: string;

    @IsOptional()
    @IsString()
    @MinLength(2, { message: 'Min surname length is 2' })
    surname?: string;

    @Transform(emptyToUndefinedDate)
    @IsOptional()
    @IsDate()
    birthday?: Date;
}
