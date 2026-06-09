import {z} from 'zod';
import {TaskPriority} from '@database/enums';

const priorityValues = Object.values(TaskPriority);

export const PriorityTaskQuerySchema = z.object({
    priority: z
        .enum(priorityValues, `Available priority fields are: ${priorityValues.join(', ')}`).optional(),
});
