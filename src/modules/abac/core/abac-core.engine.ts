import { TemplateResolver } from './abac-core.template-resolver.js';
import { PolicyResult } from './types/abac-core.policy.js';
import { PolicyEvaluator } from './abac-core.policy-evaluator.js';
import { RawRule, AbacContext } from './types/abac-core.general.types.js';

export class AbacEngine {
    private readonly evaluator = new PolicyEvaluator();
    private readonly templateResolver = new TemplateResolver();

    buildPolicy(rules: RawRule[], context: AbacContext): PolicyResult {
        const policy = this.evaluator.evaluate(rules);

        if (policy.effect === 'DENY') {
            return policy;
        }

        if (policy.effect === 'FULL_ACCESS') {
            return {
                ...policy,
                denyConditions: policy.denyConditions.map((node) =>
                    this.templateResolver.resolve(node, context),
                ),
            };
        }

        return {
            ...policy,
            allowConditions: policy.allowConditions.map((node) =>
                this.templateResolver.resolve(node, context),
            ),
            denyConditions: policy.denyConditions.map((node) =>
                this.templateResolver.resolve(node, context),
            ),
        };
    }
}
