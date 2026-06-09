import { z } from 'zod';
import { SortOrder } from '@common/enums';

const orderVariants = Object.values(SortOrder).join(', ');

export const createSortingQuerySchema = <const K extends string>(keys: readonly [K, ...K[]]) => {
    return z.strictObject({
        sortBy: z.enum(keys, `Available sort fields are: ${keys.join(', ')}`).optional(),
        order: z.enum(SortOrder, `Available order values are: ${orderVariants}`).optional(),
    });
};
