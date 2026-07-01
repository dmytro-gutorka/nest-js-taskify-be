import { SetMetadata } from '@nestjs/common';

export const SKIP_ACCESS_TOKEN_GUARD_KEY = 'skipAccessTokenGuard';

// @gutnived к какому мудулю должен относиться декоратор. который в своём названии содержит AccessToken и ни от чего не зависит?
export const SkipAccessToken = () => SetMetadata(SKIP_ACCESS_TOKEN_GUARD_KEY, true);
