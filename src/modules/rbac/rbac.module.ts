import { Module } from '@nestjs/common';
import { DatabaseModule } from '@database';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '../../infrastructure/cache/index.js';
import { RbacService } from './services/rbac.service.js';
import { RbacCacheService } from './services/rbac-cache.service.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { RbacRepository } from './repositories/rbac.repository.js';
import { RbacController } from './rbac.controller.js';
import { rbacCacheConfig } from './configs/rbac-cache.config.js';
// @gutnidev 1) у тебя в abac модуле есть index файл.
// @gutnidev 2) очень странно получается, что валидатор DSL из одного модуля, подключается как провайдер другого модуля.
// @gutnidev 3) Вообще плохо понимаю зачем тут DSL валидировать в rbac.
// @gutnidev 4) Если тебе надо из abac высунуть что-то, что где-то будет валидировать, то это должен быть сервис.
import { IsValidDslNodeConstraint } from '../abac/validators/is-valid-dsl-node.validator.js';

@Module({
    // @gutnidev дублируешь импорт ConfigModule
    imports: [DatabaseModule, CacheModule, ConfigModule, ConfigModule.forFeature(rbacCacheConfig)],
    controllers: [RbacController],
    providers: [
        RbacRepository,
        RbacService,
        RbacCacheService,
        PermissionsGuard,
        IsValidDslNodeConstraint,
        {
            provide: APP_GUARD,
            useExisting: PermissionsGuard,
        },
    ],
    exports: [RbacService, RbacCacheService, PermissionsGuard],
})
export class RbacModule {}
