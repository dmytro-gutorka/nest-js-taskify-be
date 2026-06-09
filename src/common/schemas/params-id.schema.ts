import { z, type infer as ZodInfer } from 'zod';

export const ParamsIdSchema = z.strictObject({
    id: z.coerce.number(`'id' should be a number`).int().positive(),
});

export type ParamId = ZodInfer<typeof ParamsIdSchema>;
