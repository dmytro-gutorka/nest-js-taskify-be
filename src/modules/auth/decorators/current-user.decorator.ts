import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { ActiveUser } from '../../../common/types/common.types.js';

export const CurrentUser = createParamDecorator(
    (_data: unknown, context: ExecutionContext): ActiveUser => {
        const req = context.switchToHttp().getRequest<Request>();

        if (!req.user) throw new UnauthorizedException('User is not authenticated');

        return req.user!;
    },
);
