export const TasksCacheKeys = {
    item: (taskId: number) => `tasks:item:${taskId}`,
} as const;
