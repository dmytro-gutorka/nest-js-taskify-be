import { z } from 'zod';
import { AuthProvider } from '@database/enums';

export const ActiveUserSchema = z.object({
    id: z.number(),
    email: z.email(),
    provider: z.enum(AuthProvider),
});
