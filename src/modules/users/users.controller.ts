import { type ActiveUser, ZodBody } from '@common';
import {
    Controller,
    Get,
    Patch,
    Delete,
    HttpCode,
    UseInterceptors,
    Post,
    BadRequestException,
    UploadedFile,
} from '@nestjs/common';
import { AuthProvider } from '@database/enums';
import { UsersService } from './services/users.service.js';
import { UpdateUserSchema } from './schemas/update-user.schema.js';
import type { UpdateUserDto } from './users.types.js';
import { AvatarUploadInterceptor } from '../media/interceptors/avatar-upload.interceptor.js';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    private readonly temporaryUser: ActiveUser = {
        id: 1,
        email: 'test@example.com',
        provider: AuthProvider.LOCAL,
    };

    @Get('me')
    findMe() {
        return this.usersService.findOne(this.temporaryUser.id);
    }

    @Patch('me')
    updateMe(
        @ZodBody(UpdateUserSchema)
        body: UpdateUserDto,
    ) {
        return this.usersService.update(this.temporaryUser.id, body);
    }

    @Delete('me')
    @HttpCode(200)
    deleteMe() {
        return this.usersService.delete(this.temporaryUser.id);
    }

    @Post('me/avatar')
    @UseInterceptors(AvatarUploadInterceptor)
    uploadMyAvatar(@UploadedFile() file?: Express.Multer.File) {
        if (!file) throw new BadRequestException('Avatar image is required');

        return this.usersService.uploadAvatar(this.temporaryUser.id, {
            buffer: file.buffer,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
        });
    }
}
