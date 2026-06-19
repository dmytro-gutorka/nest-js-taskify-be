import { Transform, Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { TaskPriority, TaskStatus } from '@database/enums';
import { emptyToUndefined, toArrayOrUndefined } from '../../../common/utils/converters.utils.js';
import { SortOrder } from '../../../common/enums/sort-order.enum.js';
import { TaskPriorityFromApiMap, TaskStatusFromApiMap } from '../tasks.constants.js';

const TASK_SEARCH_FIELDS = ['title', 'description'] as const;
const TASK_SORT_FIELDS = ['createdAt', 'updatedAt', 'title', 'deadline'] as const;

export class TaskQueryDto {
    @Transform(emptyToUndefined)
    @IsOptional()
    @IsString()
    @MinLength(1)
    search?: string;

    @Transform(toArrayOrUndefined)
    @IsOptional()
    @IsIn(TASK_SEARCH_FIELDS, { each: true })
    searchBy?: (typeof TASK_SEARCH_FIELDS)[number][];

    @IsOptional()
    @IsIn(TASK_SORT_FIELDS)
    sortBy?: (typeof TASK_SEARCH_FIELDS)[number];

    @IsOptional()
    @IsEnum(SortOrder)
    order?: SortOrder;

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
