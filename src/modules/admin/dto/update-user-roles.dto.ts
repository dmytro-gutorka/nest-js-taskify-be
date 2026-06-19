import { IsArray, IsEnum } from 'class-validator';
import { RoleName } from '../../../infrastructure/database/prisma/generated/enums.js';

export class UpdateUserRolesDto {
    @IsArray()
    @IsEnum(RoleName, { each: true })
    roles: RoleName[] = [];
}
