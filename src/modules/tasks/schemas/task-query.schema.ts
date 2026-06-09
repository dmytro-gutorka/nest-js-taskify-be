import { PriorityTaskQuerySchema } from './priority-task-query.schema.js';
import { StatusTaskQuerySchema } from './status-task-query.schema.js';
import { PagePaginationSchema } from '../../../common/schemas/page-pagination.schema.js';
import { createSortingQuerySchema } from '../../../common/schemas/sorting-query.schema.js';
import { createSearchQuerySchema } from '../../../common/schemas/search-query.schema.js';

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
