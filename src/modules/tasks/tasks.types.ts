import { type TaskStatusToApiMap, TaskPriorityToApiMap } from './tasks.constants.js';
import type { Task } from '../../infrastructure/database/prisma/generated/client.js';
import { ValueOf, Nullable } from '../../common/types/common.types.js';

export type TaskEntity = Task;
export type TaskEntityWithDistance = Task & { distance: number };

export interface TaskResponse {
    authorId: number;
    id: number;
    title: string;
    description: string;
    status: ValueOf<typeof TaskStatusToApiMap>;
    priority: ValueOf<typeof TaskPriorityToApiMap>;
    deadline: Date | null;
    isPrivate?: boolean;
    latitude: number | null;
    longitude: number | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface TaskMapItemResponse {
    id: number;
    title: string;
    status: ValueOf<typeof TaskStatusToApiMap>;
    priority: ValueOf<typeof TaskPriorityToApiMap>;
    latitude: number;
    longitude: number;
}

export interface TaskCoordinates {
    latitude?: Nullable<number>;
    longitude?: Nullable<number>;
}

export interface TaskNearbyItemResponse extends TaskMapItemResponse {
    distance: number;
}

export interface TaskCursorPaginatedResponse<T> {
    items: T[];
    nextCursor: number | null;
}
