import { Module } from '@nestjs/common';
import { UsersRepository } from './repositories/users.repository.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './services/users.service.js';

@Module({
    controllers: [UsersController],
    providers: [UsersRepository, UsersService],
    exports: [UsersService, UsersRepository],
})
export class UsersModule {}
