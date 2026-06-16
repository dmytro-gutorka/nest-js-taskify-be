import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SignUpLocalDto {
    @IsEmail({}, { message: 'Email is not valid' })
    email!: string;

    @IsString({ message: 'Password is required' })
    @MinLength(6, { message: 'Min password length is 6' })
    @MaxLength(72, { message: 'Max password length is 72' })
    password!: string;

    @IsOptional()
    @IsString()
    @MinLength(2, { message: 'Min name length is 2' })
    name?: string;
}
