import { z } from 'zod';
import { AuthProvider } from '../../../infrastructure/database/prisma/generated/enums.js';

export const ActiveUserSchema = z.object({
    id: z.number().int().positive(),
    email: z.email(),
    provider: z.enum(AuthProvider),
});
