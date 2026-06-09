import type { ActiveUserSchema } from '../schemas/active-user.schema.js';
import type { infer as ZodInfer } from 'zod';

export type ActiveUser = ZodInfer<typeof ActiveUserSchema>;
