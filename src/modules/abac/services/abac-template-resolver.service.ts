import {AbacContext, AbacCondition, AbacJsonValue} from "../abac.types.js";
import {Injectable, BadRequestException} from "@nestjs/common";
import {ABAC_TEMPLATE_TO_CONTEXT_PATH} from "../abac.constants.js";

@Injectable()
export class AbacTemplateResolverService {
    resolve(condition: AbacCondition, context: AbacContext): AbacCondition {
        if (condition === null) {
            return null;
        }

        return this.resolveJsonValue(condition, context) as AbacCondition;
    }

    private resolveJsonValue(value: AbacJsonValue, context: AbacContext): AbacJsonValue {
        if (Array.isArray(value)) {
            return value.map((item) => this.resolveJsonValue(item, context));
        }

        if (value && typeof value === 'object') {
            return Object.fromEntries(
                Object.entries(value).map(([key, nestedValue]) => [
                    key,
                    this.resolveJsonValue(nestedValue, context),
                ]),
            );
        }

        if (typeof value === 'string' && value.startsWith('$$')) {
            return this.resolveTemplate(value, context);
        }

        return value;
    }

    private resolveTemplate(template: string, context: AbacContext): string | number | boolean | null {
        const path =
            ABAC_TEMPLATE_TO_CONTEXT_PATH[
                template as keyof typeof ABAC_TEMPLATE_TO_CONTEXT_PATH
                ];

        if (!path) {
            throw new BadRequestException(`Unknown ABAC template: ${template}`);
        }

        return this.getByPath(context, path);
    }

    private getByPath(source: unknown, path: string): string | number | boolean | null {
        const value = path.split('.').reduce<unknown>((currentValue, key) => {
            if (!currentValue || typeof currentValue !== 'object') return undefined;

            return (currentValue as Record<string, unknown>)[key];
        }, source);

        if (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean' ||
            value === null
        ) {
            return value;
        }

        throw new BadRequestException(`ABAC template path is not resolvable: ${path}`);
    }
}