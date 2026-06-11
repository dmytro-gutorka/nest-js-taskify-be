import { z } from 'zod';

export const SignInGoogleSchema = z.strictObject({
    idToken: z.string().min(1, 'Google id token is required'),
});