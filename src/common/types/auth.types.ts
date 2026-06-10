import type { ActiveUserSchema } from '@common/schemas';
import type { infer as ZodInfer } from 'zod';

export type ActiveUser = ZodInfer<typeof ActiveUserSchema>;
