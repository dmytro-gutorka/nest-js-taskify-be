import { type TaskStatusApiMap, TaskPriorityApiMap } from './tasks.constants.js';
import type { Task } from '../../infrastructure/database/prisma/generated/client.js';
import { ValueOf } from '../../common/types/common.types.js';

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

export interface TaskCursorPaginatedResponse<T> {
    items: T[];
    nextCursor: number | null;
}
