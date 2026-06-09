import { CreateUserSchema } from './create-user.schema.js';

export const UpdateUserSchema = CreateUserSchema.omit({ email: true }).partial();
