import { AbacTaskAccessService } from './services/abac-task-access.service.js';
import { Module } from '@nestjs/common';
import { RbacModule } from '../rbac/index.js';
import { AbacService } from './services/abac.service.js';
import { AbacTemplateResolverService } from './services/abac-template-resolver.service.js';

@Module({
    imports: [RbacModule],
    providers: [AbacService, AbacTaskAccessService, AbacTemplateResolverService],
    exports: [AbacService],
})
export class AbacModule {}
