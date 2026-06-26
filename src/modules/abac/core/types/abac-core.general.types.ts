import { ActiveUser, ValueOf } from '../../../../common/types/common.types.js';
import { PolicyResult } from './abac-core.policy.js';
import { PermissionRuleEffect, PermissionRuleType } from '../constants/abac-core.constants.js';

export interface AbacContext {
    user: ActiveUser;
}

export type PermissionRuleEffect = ValueOf<typeof PermissionRuleEffect>;
export type PermissionRuleType = ValueOf<typeof PermissionRuleType>;

export interface RawRule {
    effect: PermissionRuleEffect;
    type: PermissionRuleType;
    conditions: unknown;
}

export interface IWhereBuilder<T> {
    build(policy: PolicyResult): T | null;
}
