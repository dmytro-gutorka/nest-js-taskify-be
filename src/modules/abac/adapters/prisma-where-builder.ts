import { DslOperator } from '../core/constants/abac-core.constants.js';
import { PolicyResult } from '../core/types/abac-core.policy.js';
import { IWhereBuilder } from '../core/types/abac-core.general.types.js';
import { DslNode, DslLeaf, DslGroup } from '../core/types/abac-core.dsl.types.js';

export class PrismaWhereBuilder implements IWhereBuilder {
    build(policy: PolicyResult): Record<string, unknown> | null {
        if (policy.effect === 'DENY') return null;

        if (policy.effect === 'FULL_ACCESS') {
            const denyParts = this.buildDenyPart(policy.denyConditions);

            if (denyParts.length === 0) return {};

            return { AND: denyParts };
        }

        const allowPart = this.buildAllowPart(policy.allowConditions);
        const denyParts = this.buildDenyPart(policy.denyConditions);

        if (denyParts.length === 0) return allowPart;

        return { AND: [allowPart, ...denyParts] };
    }

    private buildAllowPart(conditions: DslNode[]): Record<string, unknown> {
        return { OR: conditions.map((node) => this.buildNode(node)) };
    }

    private buildDenyPart(conditions: DslNode[]): Record<string, unknown>[] {
        return conditions.map((node) => {
            return { NOT: this.buildNode(node) };
        });
    }

    private buildNode(node: DslNode): Record<string, unknown> {
        if ('field' in node) return this.buildLeaf(node);

        return this.buildGroup(node);
    }

    private buildLeaf(leaf: DslLeaf): Record<string, unknown> {
        const { field, op, value } = leaf;

        switch (op) {
            case DslOperator.EQ:
                return { [field]: value };
            case DslOperator.NEQ:
                return { [field]: { not: value } };
            case DslOperator.IN:
                return { [field]: { in: value } };
            case DslOperator.NOT_IN:
                return { [field]: { notIn: value } };
            case DslOperator.GT:
                return { [field]: { gt: value } };
            case DslOperator.GTE:
                return { [field]: { gte: value } };
            case DslOperator.LT:
                return { [field]: { lt: value } };
            case DslOperator.LTE:
                return { [field]: { lte: value } };
            case DslOperator.CONTAINS:
                return { [field]: { has: value } };
            default:
                throw new Error(`Unsupported DSL operator: ${op}`);
        }
    }

    private buildGroup(group: DslGroup): Record<string, unknown> {
        return {
            [group.operator]: group.conditions.map((node) => this.buildNode(node)),
        };
    }
}
