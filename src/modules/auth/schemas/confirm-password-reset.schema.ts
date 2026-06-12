import {z} from 'zod'

export const ConfirmPasswordResetSchema = z
    .strictObject({
        token: z.string().min(1, 'Reset token is required'),
        newPassword: z
            .string()
            .min(6, 'Min password length is 6')
            .max(72, 'Max password length is 72'),
        confirmPassword: z
            .string()
            .min(6, 'Min password length is 6')
            .max(72, 'Max password length is 72'),
    })
    .refine(({newPassword, confirmPassword}) => newPassword === confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });