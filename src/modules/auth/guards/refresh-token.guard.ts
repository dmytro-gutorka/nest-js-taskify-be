import {
    UnauthorizedException,
    Injectable,
    type CanActivate,
    type ExecutionContext,
} from '@nestjs/common';
import { AppJwtService } from '../services/app-jwt.service.js';
import type { Request } from 'express';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
    constructor(private readonly jwtService: AppJwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<Request>();
        const refreshToken = req.cookies?.['refresh_token'] as string | undefined;

        if (!refreshToken) {
            throw new UnauthorizedException();
        }

        req.user = await this.jwtService.verify(refreshToken);

        return true;
    }
}
