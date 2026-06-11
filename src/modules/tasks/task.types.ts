import type { infer as ZodInfer } from 'zod';
import type { CursorPaginationSchema } from '@common/schemas';
import type { CreateTaskSchema } from './schemas/create-task.schema.js';
import type { UpdateTaskSchema } from './schemas/update-task.schema.js';
import type { TaskQuerySchema } from './schemas/task-query.schema.js';
import type { ValueOf } from '../../common/index.js';
import { type TaskStatusApiMap, TaskPriorityApiMap } from './tasks.constants.js';
import type { Task } from '../../infrastructure/database/prisma/generated/client.js';

// ! DTOs
export type CreateTaskDto = ZodInfer<typeof CreateTaskSchema>;
export type UpdateTaskDto = ZodInfer<typeof UpdateTaskSchema>;

// ! Queries
export type TaskFindAllQuery = ZodInfer<typeof TaskQuerySchema>;
export type TaskCursorQuery = ZodInfer<typeof CursorPaginationSchema>;

// ! Entity
export type TaskEntity = Task;

// ! Responses
export interface TaskResponse {
    authorId: number;
    id: number;
    title: string;
    description: string;
    status: ValueOf<typeof TaskStatusApiMap>;
    priority: ValueOf<typeof TaskPriorityApiMap>;
    deadline: Date | null;
    isPrivate?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface TaskPagePaginatedResponse<T> {
    items: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface TaskCursorPaginatedResponse<T> {
    items: T[];
    nextCursor: number | null;
}
