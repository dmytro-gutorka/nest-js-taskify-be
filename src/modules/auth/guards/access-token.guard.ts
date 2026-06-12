import {
    UnauthorizedException,
    Injectable,
    type CanActivate,
    type ExecutionContext,
} from '@nestjs/common';
import { AppJwtService } from '../services/app-jwt.service.js';
import type { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { SKIP_ACCESS_TOKEN_GUARD_KEY } from '../../../common/decorators/skip-access-token.decorator.js';

@Injectable()
export class AccessTokenGuard implements CanActivate {
    constructor(
        private readonly jwtService: AppJwtService,
        private readonly reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const skipAccessTokenFlow = this.reflector.getAllAndOverride<boolean>(
            SKIP_ACCESS_TOKEN_GUARD_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (skipAccessTokenFlow) return true;

        const req = context.switchToHttp().getRequest<Request>();
        const accessToken = this.getToken(req);

        req.user = await this.jwtService.verify(accessToken);

        return true;
    }

    private getToken(req: Request): string {
        const bearerToken = req.headers.authorization;
        const noTokenError = new UnauthorizedException('Missing Bearer token');

        if (!bearerToken || !bearerToken.startsWith('Bearer ')) {
            throw noTokenError;
        }

        const token = bearerToken.split('Bearer ')[1];

        if (!token) throw noTokenError;

        return token;
    }
}
