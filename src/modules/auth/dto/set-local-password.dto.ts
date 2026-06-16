import { IsString, MaxLength, MinLength } from 'class-validator';

export class SetLocalPasswordDto {
    @IsString()
    @MinLength(6, { message: 'Min password length is 6' })
    @MaxLength(72, { message: 'Max password length is 72' })
    password!: string;
}
