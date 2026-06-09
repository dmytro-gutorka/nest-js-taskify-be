import {TaskStatus, TaskPriority} from "../../infrastructure/database/prisma/generated/enums.js";

export const TaskStatusApiMap = {
    [TaskStatus.TODO]: 'todo',
    [TaskStatus.IN_PROGRESS]: 'in-progress',
    [TaskStatus.DONE]: 'done',
} as const;

export const TaskPriorityApiMap = {
    [TaskPriority.LOW]: 'low',
    [TaskPriority.MEDIUM]: 'medium',
    [TaskPriority.HIGH]: 'high',
} as const;