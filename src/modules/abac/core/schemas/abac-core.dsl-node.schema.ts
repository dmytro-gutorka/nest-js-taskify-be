import { z } from 'zod';
import { DslOperator, DslLogicalOperator } from '../constants/abac-core.constants.js';

const dslValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const dslOperatorSchema = z.enum(
    Object.values(DslOperator) as [string, ...string[]],
);

const dslLogicalOperatorSchema = z.enum(
    Object.values(DslLogicalOperator) as [string, ...string[]],
);

export const dslNodeSchema: z.ZodType = z.lazy(() =>
    z.union([
        z.object({
            field: z.string().min(1),
            op: dslOperatorSchema,
            value: z.union([dslValueSchema, z.array(dslValueSchema)]),
        }),
        z.object({
            operator: dslLogicalOperatorSchema,
            conditions: z.array(dslNodeSchema).min(1),
        }),
    ]),
);
