import { z } from 'zod';

export const PagePaginationSchema = z.strictObject({
    page: z.coerce
        .number(`'page' should be a number`)
        .min(1, `Min 'page' value is 1`)
        .default(1)
        .optional(),
    limit: z.coerce
        .number(`'limit' should be a number`)
        .min(1, `Min 'limit' value is 1`)
        .default(20)
        .optional(),
});
