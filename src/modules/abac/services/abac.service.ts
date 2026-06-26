import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { RbacService } from '../../rbac/services/rbac.service.js';
import { AbacEngine } from '../core/abac-core.engine.js';
import { WHERE_BUILDER_TOKEN } from '../abac.constants.js';
import { ActiveUser } from '../../../common/types/common.types.js';
import { PermissionKey } from '../../rbac/index.js';
import { type IWhereBuilder } from '../core/types/abac-core.general.types.js';

@Injectable()
export class AbacService {
    private readonly engine = new AbacEngine();

    constructor(
        @Inject(WHERE_BUILDER_TOKEN)
        private readonly whereBuilder: IWhereBuilder,
        private readonly rbacService: RbacService,
    ) {}

    async buildWhereOrThrow(
        user: ActiveUser,
        permissionKey: PermissionKey,
    ): Promise<Record<string, unknown>> {
        const rolePermissions = await this.rbacService.getUserRolePermissionsWithRulesByPermission(
            user.id,
            permissionKey,
        );

        const rules = rolePermissions.flatMap((rolePermission) => rolePermission.rules);
        const policy = this.engine.buildPolicy(rules, { user });
        const where = this.whereBuilder.build(policy);

        if (where === null) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return where;
    }
}
