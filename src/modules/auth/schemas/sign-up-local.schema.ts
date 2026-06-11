import { z } from 'zod';
import { SignInLocalSchema } from './sign-in-local.schema.js';

export const SignUpLocalSchema = z.strictObject({
    ...SignInLocalSchema.shape,
});
