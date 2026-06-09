import {Controller, Get} from '@nestjs/common';
import {PrismaService} from "./infrastructure/prisma/prisma.service.js";

@Controller()
export class AppController {
    constructor(
        private readonly prisma: PrismaService,) {
    }

    @Get()
    async getHello() {
        const usersCount = await this.prisma.user.count()

        return {
            message: 'Hello World!',
            usersCount,
        }
    }
}
