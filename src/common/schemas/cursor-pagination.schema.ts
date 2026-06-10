import { z } from 'zod';

export const CursorPaginationSchema = z.strictObject({
    cursor: z.preprocess(
        (value) => (value === '' || value === null ? undefined : value),
        z.coerce.number().int().positive().optional(),
    ),

    limit: z.coerce
        .number(`'limit' should be a number`)
        .int()
        .min(1, `Min 'limit' value is 1`)
        .max(50, `Max 'limit' value is 50`)
        .default(10)
        .optional(),
});
