import { Transform } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TaskPriority, TaskStatus } from '@database/enums';
import { emptyToUndefinedDate } from '../../../common/utils/converters.utils.js';

export class CreateTaskDto {
    @IsString({ message: 'Title is required field' })
    @MinLength(3, { message: 'Min title length is 3' })
    title!: string;

    @IsString({ message: 'Description is required field' })
    @MinLength(5, { message: 'Min description length is 5' })
    description!: string;

    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;

    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @Transform(emptyToUndefinedDate)
    @IsOptional()
    @IsDate()
    deadline?: Date;

    @IsOptional()
    @IsBoolean()
    isPrivate: boolean = false;
}
