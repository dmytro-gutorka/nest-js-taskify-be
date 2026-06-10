import type { CreateUploadedMediaInput, MediaEntity } from '../media.types.js';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../infrastructure/database/index.js';

@Injectable()
export class MediaRepository {
    constructor(private readonly database: DatabaseService) {}

    create(input: CreateUploadedMediaInput): Promise<MediaEntity> {
        return this.database.media.create({
            data: input,
        });
    }

    async delete(ids: number[]): Promise<void> {
        if (ids.length === 0) return;

        await this.database.media.deleteMany({
            where: {
                id: {
                    in: ids,
                },
            },
        });
    }
}
