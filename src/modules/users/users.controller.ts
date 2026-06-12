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
    Body,
} from '@nestjs/common';
import { UsersService } from './services/users.service.js';
import { AvatarUploadInterceptor } from '../media/interceptors/avatar-upload.interceptor.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { type ActiveUser } from '../../common/types/common.types.js';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('me')
    findMe(@CurrentUser() user: ActiveUser) {
        return this.usersService.findOne(user.id);
    }

    @Patch('me')
    updateMe(@CurrentUser() user: ActiveUser, @Body() body: UpdateUserDto) {
        return this.usersService.update(user.id, body);
    }

    @Delete('me')
    @HttpCode(200)
    deleteMe(@CurrentUser() user: ActiveUser) {
        return this.usersService.delete(user.id);
    }

    @Post('me/avatar')
    @UseInterceptors(AvatarUploadInterceptor)
    uploadMyAvatar(@CurrentUser() user: ActiveUser, @UploadedFile() file?: Express.Multer.File) {
        if (!file) throw new BadRequestException('Avatar image is required');

        return this.usersService.uploadAvatar(user.id, {
            buffer: file.buffer,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
        });
    }
}
