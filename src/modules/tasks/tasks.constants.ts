import { TaskStatus, TaskPriority } from '../../infrastructure/database/prisma/generated/enums.js';

export const TaskStatusToApiMap = {
    [TaskStatus.TODO]: 'todo',
    [TaskStatus.IN_PROGRESS]: 'in-progress',
    [TaskStatus.DONE]: 'done',
} as const;

export const TaskPriorityToApiMap = {
    [TaskPriority.LOW]: 'low',
    [TaskPriority.MEDIUM]: 'medium',
    [TaskPriority.HIGH]: 'high',
} as const;

export const TaskStatusFromApiMap = {
    todo: TaskStatus.TODO,
    'in-progress': TaskStatus.IN_PROGRESS,
    done: TaskStatus.DONE,
} as const;

export const TaskPriorityFromApiMap = {
    low: TaskPriority.LOW,
    medium: TaskPriority.MEDIUM,
    high: TaskPriority.HIGH,
} as const;
