import { PolicyEffect } from '../constants/abac-core.constants.js';
import { DslNode } from './abac-core.dsl.types.js';

export interface PolicyDenyResult {
    effect: typeof PolicyEffect.DENY;
}

export interface PolicyFullAccessResult {
    effect: typeof PolicyEffect.FULL_ACCESS;
    denyConditions: DslNode[];
}

export interface PolicyConditionalResult {
    effect: typeof PolicyEffect.CONDITIONAL;
    allowConditions: DslNode[];
    denyConditions: DslNode[];
}

export type PolicyResult = PolicyFullAccessResult | PolicyConditionalResult | PolicyDenyResult;
