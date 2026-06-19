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
    Put,
    Query,
    Param,
    ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './services/users.service.js';
import { AvatarUploadInterceptor } from '../media/interceptors/avatar-upload.interceptor.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { type ActiveUser } from '../../common/types/common.types.js';
import { RequiredPermissions, SkipPermissions } from '../rbac/index.js';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto.js';
import { UsersPageQueryDto } from './dto/users-page-query.dto.js';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get('me')
    @SkipPermissions()
    findMe(@CurrentUser() user: ActiveUser) {
        return this.usersService.findOne(user.id);
    }

    @Patch('me')
    @SkipPermissions()
    updateMe(@CurrentUser() user: ActiveUser, @Body() body: UpdateUserDto) {
        return this.usersService.update(user.id, body);
    }

    @Delete('me')
    @SkipPermissions()
    @HttpCode(200)
    deleteMe(@CurrentUser() user: ActiveUser) {
        return this.usersService.delete(user.id);
    }

    @Post('me/avatar')
    @SkipPermissions()
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

    @Get('/')
    @RequiredPermissions('USERS:READ')
    findAll(@Query() query: UsersPageQueryDto) {
        return this.usersService.findAll(query);
    }

    @Get(':id')
    @RequiredPermissions('USERS:READ')
    findById(@Param('id', ParseIntPipe) id: number) {
        return this.usersService.findOne(id);
    }

    @Put(':id/roles')
    @RequiredPermissions('USERS:UPDATE')
    updateUserRoles(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserRolesDto) {
        return this.usersService.updateUserRoles(id, dto.roles);
    }
}
