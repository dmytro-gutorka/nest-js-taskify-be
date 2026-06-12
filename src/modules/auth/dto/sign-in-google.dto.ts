import { IsString, MinLength } from 'class-validator';

export class SignInGoogleDto {
    @IsString()
    @MinLength(1, { message: 'Google id token is required' })
    idToken!: string;
}
