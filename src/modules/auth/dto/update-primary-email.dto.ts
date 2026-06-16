import { IsEmail } from 'class-validator';

export class UpdatePrimaryEmailDto {
    @IsEmail({}, { message: 'Email is not valid' })
    email!: string;
}
