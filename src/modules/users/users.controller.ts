import {type ActiveUser, ZodBody} from '@common';
import {
    Controller,
    Get,
    Patch,
    Delete,
    HttpCode,
    UseInterceptors,
    Post,
    BadRequestException,
    UploadedFile, UseGuards,
} from '@nestjs/common';
import {UsersService} from './services/users.service.js';
import {UpdateUserSchema} from './schemas/update-user.schema.js';
import type {UpdateUserDto} from './users.types.js';
import {AvatarUploadInterceptor} from '../media/interceptors/avatar-upload.interceptor.js';
import {CurrentUser} from '../auth/decorators/current-user.decorator.js';
import {AccessTokenGuard} from "../auth/guards/access-token.guard.js";

@Controller('users')
@UseGuards(AccessTokenGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {
    }

    @Get('me')
    findMe(@CurrentUser() user: ActiveUser) {
        return this.usersService.findOne(user.id);
    }

    @Patch('me')
    updateMe(
        @CurrentUser() user: ActiveUser,
        @ZodBody(UpdateUserSchema)
        body: UpdateUserDto,
    ) {
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
