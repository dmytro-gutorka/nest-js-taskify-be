import { BadRequestException } from '@nestjs/common';
import { ABAC_TEMPLATE_REGISTRY } from './constants/abac-core.constants.js';
import { AbacContext } from './types/abac-core.general.types.js';
import { DslNode, DslValue } from './types/abac-core.dsl.types.js';

export class TemplateResolver {
    resolve(node: DslNode, context: AbacContext): DslNode {
        return this.resolveNode(node, context);
    }

    private resolveNode(node: DslNode, context: AbacContext): DslNode {
        if ('field' in node) {
            return {
                ...node,
                value: this.resolveValue(node.value, context),
            };
        }

        return {
            ...node,
            conditions: node.conditions.map((condition) => this.resolveNode(condition, context)),
        };
    }

    private resolveValue(
        value: DslValue | DslValue[],
        context: AbacContext,
    ): DslValue | DslValue[] {
        if (Array.isArray(value)) {
            return value.map((primitiveValue) => this.resolvePrimitive(primitiveValue, context));
        }

        return this.resolvePrimitive(value, context);
    }

    private resolvePrimitive(value: DslValue, context: AbacContext): DslValue {
        if (typeof value !== 'string' || !value.startsWith('$$')) {
            return value;
        }

        const path = ABAC_TEMPLATE_REGISTRY[value];

        if (!path) {
            throw new BadRequestException(`Unknown ABAC template: ${value}`);
        }

        return this.getByPath(context, path);
    }

    private getByPath(source: unknown, path: string): DslValue {
        const result = path.split('.').reduce<unknown>((current, key) => {
            if (current === null || typeof current !== 'object') return undefined;

            return (current as Record<string, unknown>)[key];
        }, source);

        const isPrimitive =
            typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean';
        const isNull = result === null;

        if (isPrimitive || isNull) return result;

        throw new BadRequestException(`ABAC template path is not resolvable: ${path}`);
    }
}
