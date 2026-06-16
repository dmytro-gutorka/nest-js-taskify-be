import {
    type ValidationArguments,
    ValidatorConstraint,
    type ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'MatchProperty', async: false })
export class MatchPropertyConstraint implements ValidatorConstraintInterface {
    validate(value: unknown, args: ValidationArguments): boolean {
        const [propertyToMatch] = args.constraints as [string];
        const object = args.object as Record<string, unknown>;

        return value === object[propertyToMatch];
    }

    defaultMessage(args: ValidationArguments): string {
        const [propertyToMatch] = args.constraints as [string];

        return `${args.property} must match ${propertyToMatch}`;
    }
}
