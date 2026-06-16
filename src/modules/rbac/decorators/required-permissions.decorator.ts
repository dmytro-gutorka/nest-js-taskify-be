import { SetMetadata } from '@nestjs/common';
import type { PermissionKey } from '../rbac.types.js';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';

export const RequiredPermissions = (...permissions: PermissionKey[]) =>
    SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
