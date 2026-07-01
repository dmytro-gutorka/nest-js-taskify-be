import { type TaskStatusToApiMap, TaskPriorityToApiMap } from './tasks.constants.js';
// @gutnidev у тебя есть @database/client
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
    status: ValueOf<typeof TaskStatusToApiMap>;
    priority: ValueOf<typeof TaskPriorityToApiMap>;
    deadline: Date | null;
    isPrivate?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface TaskCursorPaginatedResponse<T> {
    items: T[];
    nextCursor: number | null;
}
