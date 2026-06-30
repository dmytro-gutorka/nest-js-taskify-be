import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RbacService } from './services/rbac.service.js';
import { RequiredPermissions } from './decorators/required-permissions.decorator.js';
import { RolePermissionParamsDto, RuleParamsDto } from './dto/rule-params.dto.js';
import { CreateRuleDto } from './dto/create-rule.dto.js';
import { UpdateRuleDto } from './dto/update-rule.dto.js';

@Controller('rbac')
export class RbacController {
    constructor(private readonly rbacService: RbacService) {}

    @Get('roles')
    @RequiredPermissions('RBAC:READ')
    findAllRoles() {
        return this.rbacService.findAllRolesWithPermissions();
    }

    @Get('permissions')
    @RequiredPermissions('RBAC:READ')
    findAllPermissions() {
        return this.rbacService.findAllPermissions();
    }

    @Get('roles/:roleId/permissions/:permissionId/rules')
    @RequiredPermissions('RBAC:READ')
    findRules(@Param() params: RolePermissionParamsDto) {
        return this.rbacService.findRules(params.roleId, params.permissionId);
    }

    @Post('roles/:roleId/permissions/:permissionId/rules')
    @RequiredPermissions('RBAC:CREATE')
    createRule(@Param() params: RolePermissionParamsDto, @Body() dto: CreateRuleDto) {
        return this.rbacService.createRule(params.roleId, params.permissionId, dto);
    }

    @Patch('roles/:roleId/permissions/:permissionId/rules/:ruleId')
    @RequiredPermissions('RBAC:UPDATE')
    updateRule(@Param() params: RuleParamsDto, @Body() dto: UpdateRuleDto) {
        return this.rbacService.updateRule(params.roleId, params.permissionId, params.ruleId, dto);
    }

    @Delete('roles/:roleId/permissions/:permissionId/rules/:ruleId')
    @RequiredPermissions('RBAC:DELETE')
    deleteRule(@Param() params: RuleParamsDto) {
        return this.rbacService.deleteRule(params.roleId, params.permissionId, params.ruleId);
    }
}
