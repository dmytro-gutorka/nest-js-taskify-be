import { DynamicModule, Module } from '@nestjs/common';
import { RbacModule } from '../rbac/index.js';
import { AbacService } from './services/abac.service.js';
import { WHERE_BUILDER_TOKEN } from './abac.constants.js';
import { type AbacModuleOptions } from './core/types/abac-core.general.types.js';

@Module({})
export class AbacModule {
    static forRoot(options: AbacModuleOptions): DynamicModule {
        return {
            global: true,
            module: AbacModule,
            providers: [
                {
                    provide: WHERE_BUILDER_TOKEN,
                    useValue: options.whereBuilder,
                },
                AbacService,
            ],
            imports: [RbacModule],
            exports: [AbacService],
        };
    }
}
