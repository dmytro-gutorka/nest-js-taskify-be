import { DynamicModule, Module } from '@nestjs/common';
import { RbacModule } from '../rbac/index.js';
import { AbacService } from './services/abac.service.js';
import { WHERE_BUILDER_TOKEN } from './abac.constants.js';
import { type IWhereBuilder } from './core/types/abac-core.general.types.js';

export interface AbacModuleOptions {
    whereBuilder: IWhereBuilder<Record<string, unknown>>;
}

@Module({})
export class AbacModule {
    static forRoot(options: AbacModuleOptions): DynamicModule {
        return {
            global: true,
            module: AbacModule,
            imports: [RbacModule],
            providers: [
                {
                    provide: WHERE_BUILDER_TOKEN,
                    useValue: options.whereBuilder,
                },
                AbacService,
            ],
            exports: [AbacService],
        };
    }
}
