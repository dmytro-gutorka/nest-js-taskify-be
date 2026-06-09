import { z } from 'zod';

/**
 * Full-text search schema with repeated `searchBy` params.
 * - Accepts:q=term&searchBy=email&searchBy=name
 */
export function createSearchQuerySchema<const K extends string>(fields: readonly [K, ...K[]]) {
    const FieldEnum = z.enum(fields);

    return z.strictObject({
        search: z.preprocess(
            (searchValue) => (searchValue === '' ? undefined : searchValue),
            z.string().trim().min(1).optional(),
        ),
        searchBy: z
            .union(
                [FieldEnum, z.array(FieldEnum).nonempty()],
                `Available search fields are: ${fields.join(', ')}`,
            )
            .transform((v) => (!v ? undefined : Array.isArray(v) ? v : [v]))
            .optional(),
    });
}
