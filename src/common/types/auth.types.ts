import type { ActiveUserSchema } from '@common/schemas';
import { z } from 'zod';

export type ActiveUser = z.infer<typeof ActiveUserSchema>;
