import { createHash, randomBytes } from 'crypto';

export function generatePasswordResetToken(bytes: number): string {
    return randomBytes(bytes).toString('hex');
}

export function hashPasswordResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}