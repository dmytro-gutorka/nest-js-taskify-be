import { Controller, Get, Put, Param, Body, Query, UseGuards, HttpCode } from '@nestjs/common';
import { AdminService } from './services/admin.service.js';
import { AdminRoleGuard } from './guards/admin-role.guard.js';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto.js';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto.js';
import { ParamsIdDto } from '../../common/dto/params-id.dto.js';
import { SkipPermissions } from '../rbac/index.js';
import { toUserWithRolesResponse } from './mappers/toUserWithRolesResponse.js';
import { toUserDetailsWithPermissionsResponse } from './mappers/toUserDetailsWithPermissionsResponse.js';
import { toRolesWithPermissionsResponse } from './mappers/toRolesWithPermissionsResponse.js';

@Controller('admin')
@UseGuards(AdminRoleGuard)
@SkipPermissions()
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('users')
    async getUsers(@Query() query: AdminUsersQueryDto) {
        const paginatedUsersResponse = await this.adminService.getUsers(query);
        const mappedUsersWithRolesNames = paginatedUsersResponse.items.map((user) =>
            toUserWithRolesResponse(user),
        );

        return {
            ...paginatedUsersResponse,
            items: mappedUsersWithRolesNames,
        };
    }

    @Get('users/:id')
    async getUserById(@Param() params: ParamsIdDto) {
        const userDetails = await this.adminService.getUserById(params.id);

        return toUserDetailsWithPermissionsResponse(userDetails);
    }

    @Put('users/:id/roles')
    @HttpCode(200)
    async updateUserRoles(@Param() params: ParamsIdDto, @Body() body: UpdateUserRolesDto) {
        const updatedUser = await this.adminService.updateUserRoles(params.id, body);

        return toUserDetailsWithPermissionsResponse(updatedUser);
    }

    @Get('roles')
    async getRoles() {
        const rolesWithPermissions = await this.adminService.getRoles();

        return rolesWithPermissions.map((role) => toRolesWithPermissionsResponse(role));
    }

    @Get('permissions')
    async getPermissions() {
        return await this.adminService.getPermissions();
    }
}
