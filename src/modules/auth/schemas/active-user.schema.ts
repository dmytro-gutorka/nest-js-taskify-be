import { z } from 'zod';
// @gutnidev у тебя есть @database/enums
import { AuthProvider } from '../../../infrastructure/database/prisma/generated/enums.js';

export const ActiveUserSchema = z.object({
    id: z.number().int().positive(),
    email: z.email(),
    provider: z.enum(AuthProvider),
});
