import { SetMetadata } from '@nestjs/common';

export const SKIP_ACCESS_TOKEN_GUARD_KEY = 'skipAccessTokenGuard';

export const SkipAccessToken = () => SetMetadata(SKIP_ACCESS_TOKEN_GUARD_KEY, true);
