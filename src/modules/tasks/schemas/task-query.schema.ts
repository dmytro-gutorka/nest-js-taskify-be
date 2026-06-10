import { PriorityTaskQuerySchema } from './priority-task-query.schema.js';
import { StatusTaskQuerySchema } from './status-task-query.schema.js';
import { PagePaginationSchema } from '@common/schemas';
import { createSortingQuerySchema } from '@common/schemas';
import { createSearchQuerySchema } from '@common/schemas';

const SearchQuerySchema = createSearchQuerySchema(['title', 'description']);
const SortingQuerySchema = createSortingQuerySchema([
    'createdAt',
    'updatedAt',
    'title',
    'deadline',
]);

export const TaskQuerySchema = SearchQuerySchema.extend(SortingQuerySchema.shape)
    .extend(PagePaginationSchema.shape)
    .extend(StatusTaskQuerySchema.shape)
    .extend(PriorityTaskQuerySchema.shape);
