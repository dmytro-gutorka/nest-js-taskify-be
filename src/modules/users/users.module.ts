import { Module } from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './services/users.service.js';
import { MediaModule } from '../media/index.js';

@Module({
    imports: [MediaModule],
    controllers: [UsersController],
    providers: [UsersService, UsersRepository],
    exports: [UsersService, UsersRepository],
})
export class UsersModule {}
