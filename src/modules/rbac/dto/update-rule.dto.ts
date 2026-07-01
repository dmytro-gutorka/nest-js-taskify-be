import { IsEnum, IsOptional } from 'class-validator';
import {
    PermissionRuleEffect,
    PermissionRuleType,
} from '../../abac/core/constants/abac-core.constants.js';
import { IsValidDslNode } from '../../abac/validators/is-valid-dsl-node.validator.js';
import type { DslNode } from '../../abac/core/types/abac-core.dsl.types.js';

export class UpdateRuleDto {
    @IsOptional()
    @IsEnum(PermissionRuleEffect)
    effect?: string;

    @IsOptional()
    @IsEnum(PermissionRuleType)
    type?: string;

    @IsOptional()
    @IsValidDslNode()
    conditions?: DslNode;
}
