import { Prisma } from '@database/client';

const DEFAULT_TASK_SEARCH_FIELDS = ['title', 'description'] as const;

type TaskSearchField = (typeof DEFAULT_TASK_SEARCH_FIELDS)[number];

export function buildTaskSearchWhere(
    search?: string,
    searchBy?: TaskSearchField[],
): Prisma.TaskWhereInput {
    if (!search) return {};

    const fields = searchBy?.length ? searchBy : DEFAULT_TASK_SEARCH_FIELDS;

    return {
        OR: fields.map((field) => ({
            [field]: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
            },
        })),
    };
}
