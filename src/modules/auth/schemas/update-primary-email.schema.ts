import {z} from 'zod';

export const UpdatePrimaryEmailSchema = z.strictObject({
    email: z.email('Email is not valid'),
});