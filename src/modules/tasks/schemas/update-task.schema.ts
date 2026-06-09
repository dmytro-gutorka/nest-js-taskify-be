import { z } from 'zod';
import { CreateTaskSchema } from './create-task.schema.js';

export const UpdateTaskSchema = z.strictObject({}).extend(CreateTaskSchema.shape).partial();
