import { z } from 'zod';

export const SetLocalPasswordSchema = z.strictObject({
    password: z
        .string()
        .min(6, 'Min password length is 6')
        .max(72, 'Max password length is 72'),
});