import { Type, Transform } from 'class-transformer';
import { IsLatitude, IsLongitude, IsOptional, IsEnum } from 'class-validator';
import { TaskStatusFromApiMap, TaskPriorityFromApiMap } from '../tasks.constants.js';
import {
    TaskStatus,
    TaskPriority,
} from '../../../infrastructure/database/prisma/generated/enums.js';

export class TaskMapQueryDto {
    @Type(() => Number)
    @IsLatitude()
    north!: number;

    @Type(() => Number)
    @IsLatitude()
    south!: number;

    @Type(() => Number)
    @IsLongitude()
    east!: number;

    @Type(() => Number)
    @IsLongitude()
    west!: number;

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
}
