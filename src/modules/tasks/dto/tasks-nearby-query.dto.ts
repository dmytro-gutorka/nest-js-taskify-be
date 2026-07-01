import { Type } from 'class-transformer';
import { IsLatitude, IsLongitude, IsInt, Min, Max } from 'class-validator';

export class TasksNearbyQueryDto {
    @Type(() => Number)
    @IsLatitude()
    latitude!: number;

    @Type(() => Number)
    @IsLongitude()
    longitude!: number;

    @Type(() => Number)
    @IsInt()
    @Min(100)
    @Max(100_000)
    radius!: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 20;
}
