import { Validate, ValidatorConstraint, type ValidatorConstraintInterface } from 'class-validator';
import { dslNodeSchema } from '../core/schemas/abac-core.dsl-node.schema.js';

@ValidatorConstraint({ name: 'IsValidDslNode', async: false })
export class IsValidDslNodeConstraint implements ValidatorConstraintInterface {
    validate(value: unknown): boolean {
        return dslNodeSchema.safeParse(value).success;
    }

    defaultMessage(): string {
        return 'conditions must be a valid DSL node (DslLeaf or DslGroup)';
    }
}

export function IsValidDslNode() {
    return Validate(IsValidDslNodeConstraint);
}
