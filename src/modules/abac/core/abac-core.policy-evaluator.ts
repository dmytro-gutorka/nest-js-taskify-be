import { BadRequestException } from '@nestjs/common';
import { PolicyEffect } from './constants/abac-core.constants.js';
import { RawRule } from './types/abac-core.general.types.js';
import {
    PolicyResult,
    PolicyFullAccessResult,
    PolicyConditionalResult,
} from './types/abac-core.policy.js';
import { DslNode } from './types/abac-core.dsl.types.js';

export class PolicyEvaluator {
    evaluate(rules: RawRule[]): PolicyResult {
        if (rules.length === 0) {
            return { effect: PolicyEffect.DENY };
        }

        const hasFullDeny = rules.some(
            (rule) => rule.effect === 'DENY' && rule.type === 'FULL_ACCESS',
        );
        if (hasFullDeny) {
            return { effect: PolicyEffect.DENY };
        }

        const denyConditions = rules
            .filter((rule) => rule.effect === 'DENY' && rule.type === 'CONDITIONAL')
            .map((rule) => rule.conditions as DslNode);

        const hasFullAllow = rules.some(
            (rule) => rule.effect === 'ALLOW' && rule.type === 'FULL_ACCESS',
        );
        if (hasFullAllow) {
            return {
                effect: PolicyEffect.FULL_ACCESS,
                denyConditions,
            } satisfies PolicyFullAccessResult;
        }

        const allowRules = rules.filter(
            (rule) => rule.effect === 'ALLOW' && rule.type === 'CONDITIONAL',
        );

        if (allowRules.length === 0) {
            return { effect: PolicyEffect.DENY };
        }

        for (const rule of allowRules) {
            if (!rule.conditions) {
                throw new BadRequestException('ALLOW + CONDITIONAL rule is missing conditions');
            }
        }

        const allowConditions = allowRules.map((rule) => rule.conditions as DslNode);

        return {
            effect: PolicyEffect.CONDITIONAL,
            allowConditions,
            denyConditions,
        } satisfies PolicyConditionalResult;
    }
}
