import { z } from 'zod';
import { AuthProvider } from '../../generated/prisma/enums.js';

export const ActiveUserSchema = z.object({
    id: z.number(),
    email: z.email(),
    provider: z.enum(AuthProvider),
});
