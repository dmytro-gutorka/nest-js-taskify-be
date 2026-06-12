import { IsString, MaxLength, MinLength, Validate } from 'class-validator';
import { MatchPropertyConstraint } from './match-property.validator.js';

export class ConfirmPasswordResetDto {
    @IsString()
    @MinLength(1, { message: 'Reset token is required' })
    token!: string;

    @IsString()
    @MinLength(6, { message: 'Min password length is 6' })
    @MaxLength(72, { message: 'Max password length is 72' })
    newPassword!: string;

    @IsString()
    @MinLength(6, { message: 'Min password length is 6' })
    @MaxLength(72, { message: 'Max password length is 72' })
    @Validate(MatchPropertyConstraint, ['newPassword'], {
        message: 'Passwords do not match',
    })
    confirmPassword!: string;
}
