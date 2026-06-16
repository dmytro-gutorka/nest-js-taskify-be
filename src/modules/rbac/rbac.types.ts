import { PermissionAction, PermissionResource } from '@database/enums';
import { ValueOf } from '../../common/types/common.types.js';

export type RbacResourceValue = ValueOf<typeof PermissionResource>;
export type RbacActionValue = ValueOf<typeof PermissionAction>;

export type PermissionKey = `${RbacResourceValue}:${RbacActionValue}`;
