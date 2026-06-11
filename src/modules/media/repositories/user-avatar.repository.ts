import type { UserAvatarWithMedia, CreateUserAvatarInput } from '../media.types.js';
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../infrastructure/database/index.js';

@Injectable()
export class UserAvatarRepository {
    constructor(private readonly database: DatabaseService) {}

    create(input: CreateUserAvatarInput) {
        return this.database.userAvatar.create({
            data: input,
        });
    }

    findByUserId(userId: number): Promise<UserAvatarWithMedia | null> {
        return this.database.userAvatar.findUnique({
            where: {
                userId,
            },
            include: {
                media: true,
            },
        });
    }

    async updateMediaByUserId(userId: number, mediaId: number): Promise<void> {
        await this.database.userAvatar.update({
            where: {
                userId,
            },
            data: {
                mediaId,
            },
        });
    }
}
