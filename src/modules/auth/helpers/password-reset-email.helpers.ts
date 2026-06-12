export function buildPasswordResetUrl(frontendUrl: string, token: string): string {
    const resetUrl = new URL('/reset-password', frontendUrl);

    resetUrl.searchParams.set('token', token);

    return resetUrl.toString();
}

export function buildPasswordResetEmailHtml(resetUrl: string): string {
    return `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111827;">
            <h1 style="font-size: 20px; margin-bottom: 12px;">Reset your password</h1>
            <p>You requested a password reset for your Taskify account.</p>
            <p>Click the button below to choose a new password.</p>
            <p style="margin: 24px 0;">
                <a
                    href="${resetUrl}"
                    style="display: inline-block; padding: 10px 16px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 6px;"
                >
                    Reset password
                </a>
            </p>
            <p>If you did not request this password reset, you can safely ignore this email.</p>
            <p>This link will expire soon.</p>
        </div>
    `;
}

export function buildPasswordResetEmailText(resetUrl: string): string {
    return [
        'Reset your password',
        '',
        'You requested a password reset for your Taskify account.',
        'Open this link to choose a new password:',
        resetUrl,
        '',
        'If you did not request this password reset, you can safely ignore this email.',
        'This link will expire soon.',
    ].join('\n');
}
