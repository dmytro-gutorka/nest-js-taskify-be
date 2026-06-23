import {BuildTaskAccessWhereInput, TaskAccessWhere, RolePermissionWithRules} from "../abac.types.js";
import {Injectable, BadRequestException} from "@nestjs/common";
import {AbacTemplateResolverService} from "./abac-template-resolver.service.js";
import {
    RolePermissionRuleEffect,
    RolePermissionRuleType
} from "@database/client";
import {RolePermissionRule, Prisma} from "../../../infrastructure/database/prisma/generated/client.js";
import {isAbacCondition} from "../abac.guards.js";

@Injectable()
export class AbacTaskAccessService {
    constructor(private readonly templateResolver: AbacTemplateResolverService) {}

    buildWhere(input: BuildTaskAccessWhereInput): TaskAccessWhere {
        const scopedRolePermissions = this.getRolePermissionsForPermission(input);

        if (this.hasNoRolePermissions(scopedRolePermissions)) return null;

        const rules = this.getRules(scopedRolePermissions);

        if (this.hasNoRules(rules)) return null;
        if (this.hasFullDeny(rules)) return null;
        if (this.hasFullAllow(rules)) return {};

        const allowConditionalRules = this.getAllowConditionalRules(rules);

        if (allowConditionalRules.length === 0) return null;

        return this.buildConditionalWhere(allowConditionalRules, input);
    }

    private getRolePermissionsForPermission(
        input: BuildTaskAccessWhereInput,
    ): RolePermissionWithRules[] {
        return input.rolePermissions.filter(
            (rolePermission) => rolePermission.permission.key === input.permissionKey,
        );
    }

    private hasNoRolePermissions(rolePermissions: RolePermissionWithRules[]): boolean {
        return rolePermissions.length === 0;
    }

    private getRules(rolePermissions: RolePermissionWithRules[]): RolePermissionRule[] {
        return rolePermissions.flatMap((rolePermission) => rolePermission.rules);
    }

    private hasNoRules(rules: RolePermissionRule[]): boolean {
        return rules.length === 0;
    }

    private hasFullDeny(rules: RolePermissionRule[]): boolean {
        return rules.some(
            (rule) =>
                rule.effect === RolePermissionRuleEffect.DENY &&
                rule.type === RolePermissionRuleType.FULL_ACCESS,
        );
    }

    private hasFullAllow(rules: RolePermissionRule[]): boolean {
        return rules.some(
            (rule) =>
                rule.effect === RolePermissionRuleEffect.ALLOW &&
                rule.type === RolePermissionRuleType.FULL_ACCESS,
        );
    }

    private getAllowConditionalRules(rules: RolePermissionRule[]): RolePermissionRule[] {
        return rules.filter(
            (rule) =>
                rule.effect === RolePermissionRuleEffect.ALLOW &&
                rule.type === RolePermissionRuleType.CONDITIONAL,
        );
    }

    private buildConditionalWhere(
        rules: RolePermissionRule[],
        input: BuildTaskAccessWhereInput,
    ): Prisma.TaskWhereInput {
        const resolvedConditions = rules.map((rule) =>
            this.resolveConditionalRule(rule, input),
        );

        if (resolvedConditions.length === 1) return resolvedConditions[0];

        return {
            OR: resolvedConditions,
        };
    }

    private resolveConditionalRule(
        rule: RolePermissionRule,
        input: BuildTaskAccessWhereInput,
    ): Prisma.TaskWhereInput {
        if (!rule.conditions) {
            throw new BadRequestException('Conditional ABAC rule requires conditions');
        }

        if (!isAbacCondition(rule.conditions)) {
            throw new BadRequestException(
                'Conditional ABAC rule conditions must be an object or array of objects',
            );
        }

        return this.templateResolver.resolve(rule.conditions, {
            user: input.user,
        }) as Prisma.TaskWhereInput;
    }
}