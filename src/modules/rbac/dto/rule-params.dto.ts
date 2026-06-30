import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class RolePermissionParamsDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    roleId!: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    permissionId!: number;
}

export class RuleParamsDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    roleId!: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    permissionId!: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    ruleId!: number;
}
