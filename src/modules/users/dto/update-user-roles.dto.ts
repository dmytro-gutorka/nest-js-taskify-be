import { IsArray, IsEnum, ArrayUnique } from 'class-validator';
import { RoleName } from '../../../infrastructure/database/prisma/generated/enums.js';

export class UpdateUserRolesDto {
    @IsArray()
    @ArrayUnique()
    @IsEnum(RoleName, { each: true })
    roles: RoleName[] = [];
}
