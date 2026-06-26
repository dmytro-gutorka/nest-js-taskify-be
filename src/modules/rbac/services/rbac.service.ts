import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@database/client';
import { RoleName } from '../../../infrastructure/database/prisma/generated/enums.js';
import { RbacCacheService } from './rbac-cache.service.js';
import { RbacRepository } from '../repositories/rbac.repository.js';
import { PermissionKey, RoleWithPermissionsResponse } from '../rbac.types.js';
import { PermissionRuleType } from '../../abac/core/constants/abac-core.constants.js';
import { CreateRuleDto } from '../dto/create-rule.dto.js';
import { UpdateRuleDto } from '../dto/update-rule.dto.js';

@Injectable()
export class RbacService {
    constructor(
        private readonly rbacCacheService: RbacCacheService,
        private readonly rbacRepository: RbacRepository,
    ) {}

    async getUserPermissionKeys(userId: number): Promise<PermissionKey[]> {
        const cachedPermissionKeys = await this.rbacCacheService.getUserPermissionKeys(userId);

        if (cachedPermissionKeys) {
            return cachedPermissionKeys;
        }

        const permissionKeys = await this.rbacRepository.getUserPermissionKeys(userId);

        await this.rbacCacheService.setUserPermissionKeys(userId, permissionKeys);

        return permissionKeys;
    }

    async getUserRoleNamesList(userId: number): Promise<RoleName[]> {
        const cachedRoleNames = await this.rbacCacheService.getUserRoleNames(userId);

        if (cachedRoleNames) {
            return cachedRoleNames;
        }

        const roleNames = await this.rbacRepository.getUserRoleNamesList(userId);

        await this.rbacCacheService.setUserRoleNames(userId, roleNames);

        return roleNames;
    }

    async getRoleNamesByUserIds(userIds: number[]): Promise<Map<number, RoleName[]>> {
        return this.rbacRepository.getRoleNamesByUserIds(userIds);
    }

    async setUserRoles(userId: number, roleNames: RoleName[]): Promise<void> {
        const uniqueRoleNames = [...new Set(roleNames)];

        const roles = await this.rbacRepository.findRolesByNames(uniqueRoleNames);

        if (roles.length !== uniqueRoleNames.length) {
            throw new BadRequestException('One or more roles do not exist');
        }

        await this.rbacRepository.setUserRolesByRoleIds(
            userId,
            roles.map((role) => role.id),
        );

        await this.rbacCacheService.invalidateUserAccess(userId);
    }

    async assignRoleToUser(
        userId: number,
        roleName: RoleName,
        tx?: Prisma.TransactionClient,
    ): Promise<void> {
        const role = await this.rbacRepository.findRoleByName(roleName, tx);

        await this.rbacRepository.assignRoleToUser(userId, role.id, tx);
        await this.rbacCacheService.invalidateUserAccess(userId);
    }

    async findAllRolesWithPermissions(): Promise<RoleWithPermissionsResponse[]> {
        const roles = await this.rbacRepository.findAllRolesWithPermissions();

        return roles.map((role) => ({
            id: role.id,
            name: role.name,
            description: role.description,
            permissions: role.rolePermissions.map((rolePermission) => ({
                id: rolePermission.permission.id,
                resource: rolePermission.permission.resource,
                action: rolePermission.permission.action,
                key: rolePermission.permission.key as PermissionKey,
                description: rolePermission.permission.description,
            })),
        }));
    }

    async findAllPermissions() {
        return this.rbacRepository.findAllPermissions();
    }

    async findRules(roleId: number, permissionId: number) {
        const rolePermission = await this.rbacRepository.findRolePermission(roleId, permissionId);

        if (!rolePermission) throw new NotFoundException('Role permission not found');

        return this.rbacRepository.findRules(rolePermission.id);
    }

    async createRule(roleId: number, permissionId: number, dto: CreateRuleDto) {
        const rolePermission = await this.rbacRepository.findRolePermission(roleId, permissionId);

        if (!rolePermission) throw new NotFoundException('Role permission not found');

        if (dto.type === PermissionRuleType.CONDITIONAL && !dto.conditions) {
            throw new BadRequestException('conditions is required when type is CONDITIONAL');
        }

        return this.rbacRepository.createRule(rolePermission.id, {
            effect: dto.effect,
            type: dto.type,
            conditions: dto.conditions as Prisma.InputJsonValue | undefined,
        });
    }

    async updateRule(roleId: number, permissionId: number, ruleId: number, dto: UpdateRuleDto) {
        const rolePermission = await this.rbacRepository.findRolePermission(roleId, permissionId);

        if (!rolePermission) throw new NotFoundException('Role permission not found');

        const rule = await this.rbacRepository.findRule(ruleId, rolePermission.id);

        if (!rule) throw new NotFoundException('Rule not found');

        const resolvedType = dto.type ?? rule.type;
        const resolvedConditions = dto.conditions ?? rule.conditions;

        if (resolvedType === PermissionRuleType.CONDITIONAL && !resolvedConditions) {
            throw new BadRequestException('conditions is required when type is CONDITIONAL');
        }

        return this.rbacRepository.updateRule(ruleId, {
            effect: dto.effect,
            type: dto.type,
            conditions: dto.conditions as Prisma.InputJsonValue | undefined,
        });
    }

    async deleteRule(roleId: number, permissionId: number, ruleId: number) {
        const rolePermission = await this.rbacRepository.findRolePermission(roleId, permissionId);

        if (!rolePermission) throw new NotFoundException('Role permission not found');

        const rule = await this.rbacRepository.findRule(ruleId, rolePermission.id);

        if (!rule) throw new NotFoundException('Rule not found');

        await this.rbacRepository.deleteRule(ruleId);
    }

    async getUserRolePermissionsWithRulesByPermission(
        userId: number,
        permissionKey: PermissionKey,
    ) {
        return this.rbacRepository.getUserRolePermissionsWithRulesByPermission(
            userId,
            permissionKey,
        );
    }
}
