import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service.js';

// @gutnidev глобальные модули - зло
@Global()
@Module({
    providers: [DatabaseService],
    exports: [DatabaseService],
})
export class DatabaseModule {}
