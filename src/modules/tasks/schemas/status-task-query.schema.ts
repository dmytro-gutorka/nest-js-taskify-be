import { z } from 'zod';
import { TaskStatus } from '../../../generated/prisma/enums.js';

const statusValues = Object.values(TaskStatus);

export const StatusTaskQuerySchema = z.object({
    status: z
        .enum(statusValues, `Available status fields are: ${statusValues.join(', ')}`)
        .default(TaskStatus.TODO),
});
