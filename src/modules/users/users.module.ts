import { Module } from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './services/users.service.js';
import { MediaModule } from '../media/index.js';
import { AuthCoreModule } from '../auth/auth-core.module.js';
import { RbacModule } from '../rbac/index.js';

@Module({
    imports: [MediaModule, AuthCoreModule, RbacModule],
    controllers: [UsersController],
    providers: [UsersService, UsersRepository],
    exports: [UsersService, UsersRepository],
})
export class UsersModule {}
