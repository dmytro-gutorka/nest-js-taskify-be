import { IsEmail, IsEnum, IsInt, Min } from 'class-validator';
import { AuthProvider } from '@database/enums';

export class ActiveUserDto {
    @IsInt()
    @Min(1)
    id!: number;

    @IsEmail()
    email!: string;

    @IsEnum(AuthProvider)
    provider!: AuthProvider;
}
