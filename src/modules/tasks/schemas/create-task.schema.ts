import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@database/enums';

export const CreateTaskSchema = z.strictObject({
    title: z.string('Title is required field').min(3, 'Min title length is 3'),
    description: z.string('Description is required field').min(5, 'Min description length is 5'),
    status: z.enum(TaskStatus).optional(),
    priority: z.enum(TaskPriority).optional(),
    deadline: z.preprocess(
        (date) => (date === '' || date === null ? undefined : date),
        z.coerce.date().optional(),
    ),
    isPrivate: z.boolean().optional().default(false),
});
