import { registerAs } from '@nestjs/config';

export const tasksCacheConfig = registerAs('tasksCache', () => ({
    taskItemTtl: Number(process.env.TASK_ITEM_CACHE_TTL ?? 60),
}));
