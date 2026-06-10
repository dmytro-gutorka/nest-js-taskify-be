import type { infer as ZodInfer } from 'zod';
import type { TaskStatus, TaskPriority } from '@database/enums';
import type { CursorPaginationSchema } from '@common/schemas';
import type { CreateTaskSchema } from './schemas/create-task.schema.js';
import type { UpdateTaskSchema } from './schemas/update-task.schema.js';
import type { TaskQuerySchema } from './schemas/task-query.schema.js';

// ! DTOs
export type CreateTaskDto = ZodInfer<typeof CreateTaskSchema>;
export type UpdateTaskDto = ZodInfer<typeof UpdateTaskSchema>;

// ! Queries
export type TaskFindAllQuery = ZodInfer<typeof TaskQuerySchema>;
export type TaskCursorQuery = ZodInfer<typeof CursorPaginationSchema>;

// ! Responses
export interface TaskResponse {
    authorId: number;
    id: number;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    deadline: Date | null;
    isPrivate?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface TaskPagePaginatedResponse {
    items: TaskResponse[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface TaskCursorPaginatedResponse {
    items: TaskResponse[];
    nextCursor: number | null;
}
