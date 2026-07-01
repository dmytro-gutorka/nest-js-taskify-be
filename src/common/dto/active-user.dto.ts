import { IsEmail, IsEnum, IsInt, Min } from 'class-validator';
import { AuthProvider } from '@database/enums';

// @gutnived нигде не используется.
export class ActiveUserDto {
    @IsInt()
    @Min(1)
    id!: number;

    @IsEmail()
    email!: string;

    @IsEnum(AuthProvider)
    provider!: AuthProvider;
}
