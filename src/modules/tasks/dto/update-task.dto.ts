import { Transform } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TaskPriority, TaskStatus } from '@database/enums';
import { emptyToUndefinedDate } from '../../../common/utils/converters.utils.js';
import { TaskStatusFromApiMap, TaskPriorityFromApiMap } from '../tasks.constants.js';

export class UpdateTaskDto {
    @IsOptional()
    @IsString()
    @MinLength(3, { message: 'Min title length is 3' })
    title?: string;

    @IsOptional()
    @IsString()
    @MinLength(5, { message: 'Min description length is 5' })
    description?: string;

    @Transform(({ value }) => {
        if (!value) return undefined;
        return TaskStatusFromApiMap[value as keyof typeof TaskStatusFromApiMap];
    })
    @IsOptional()
    @IsEnum(TaskStatus)
    status?: TaskStatus;

    @Transform(({ value }) => {
        if (!value) return undefined;
        return TaskPriorityFromApiMap[value as keyof typeof TaskPriorityFromApiMap];
    })
    @IsOptional()
    @IsEnum(TaskPriority)
    priority?: TaskPriority;

    @Transform(emptyToUndefinedDate)
    @IsOptional()
    @IsDate()
    deadline?: Date;

    @IsOptional()
    @IsBoolean()
    isPrivate?: boolean;
}
