import { MediaType } from '../../../infrastructure/database/prisma/generated/enums.js';

export const MediaTypeApiMap = {
    [MediaType.IMAGE]: 'image',
} as const;
