import { createHash } from 'crypto';

function hashQuery(query: object): string {
    const sorted = Object.fromEntries(
        Object.entries(query)
            .filter(([, value]) => value !== undefined && value !== null)
            .sort(([firstValue], [secondsValue]) => firstValue.localeCompare(secondsValue)),
    );
    return createHash('sha256').update(JSON.stringify(sorted)).digest('hex').slice(0, 16);
}

export const CacheKeyFactory = {
    rbacUserPermissions: (userId: number) => `rbac:user:${userId}:permissions`,

    taskItem: (taskId: number) => `tasks:item:${taskId}`,

    taskList: (userId: number, query: object) => `tasks:user:${userId}:list:${hashQuery(query)}`,

    taskFeed: (userId: number, query: object) => `tasks:user:${userId}:feed:${hashQuery(query)}`,

    taskUserListPattern: (userId: number) => `tasks:user:${userId}:list:*`,

    taskUserFeedPattern: (userId: number) => `tasks:user:${userId}:feed:*`,
} as const;
