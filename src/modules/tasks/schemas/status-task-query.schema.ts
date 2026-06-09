import {z} from 'zod';
import {TaskStatus} from '@database/enums';

const statusValues = Object.values(TaskStatus);

export const StatusTaskQuerySchema = z.object({
    status: z
        .enum(statusValues, `Available status fields are: ${statusValues.join(', ')}`).optional(),
});
