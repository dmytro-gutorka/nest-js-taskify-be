import { z } from 'zod';

export const CreateUserSchema = z.strictObject({
    email: z.email('Email is not valid'),
    name: z.string().min(2, 'Min name length is 2').optional(),
    surname: z.string().min(2, 'Min surname length is 2').optional(),
    birthday: z.preprocess(
        (date) => (date === '' || date === null ? undefined : date),
        z.coerce.date().optional(),
    ),
});
