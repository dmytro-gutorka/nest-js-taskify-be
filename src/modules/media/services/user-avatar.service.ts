import type { UploadUserAvatarInput, MediaEntity } from '../media.types.js';
import { Injectable } from '@nestjs/common';
import { UserAvatarRepository } from '../repositories/user-avatar.repository.js';
import { MediaService } from './media.service.js';
import { MediaType } from '../../../infrastructure/database/prisma/generated/enums.js';
import { MediaStorageFolderPreset } from '../../../infrastructure/media-storage/media-storage.types.js';
import { MediaTypeApiMap } from '../constants/media.constants.js';

@Injectable()
export class UserAvatarService {
    constructor(
        private readonly userAvatarRepository: UserAvatarRepository,
        private readonly mediaService: MediaService,
    ) {}

    async uploadUserAvatar(userId: number, avatar: UploadUserAvatarInput): Promise<MediaEntity> {
        const currentAvatar = await this.userAvatarRepository.findByUserId(userId);

        const newMedia = await this.mediaService.upload({
            buffer: avatar.buffer,
            fileName: avatar.originalName,
            mimeType: avatar.mimeType,
            size: avatar.size,
            mediaType: MediaType.IMAGE,
            resourceType: MediaTypeApiMap.IMAGE,
            folderPreset: {
                preset: MediaStorageFolderPreset.USER_AVATAR,
                userId,
            },
        });

        try {
            if (currentAvatar)
                await this.userAvatarRepository.updateMediaByUserId(userId, newMedia.id);
            if (!currentAvatar)
                await this.userAvatarRepository.create({ userId, mediaId: newMedia.id });
        } catch (error) {
            await this.mediaService.deleteOne(newMedia);

            throw error;
        }

        if (currentAvatar?.media) await this.mediaService.tryDeleteOne(currentAvatar.media);

        return newMedia;
    }

    async getCurrentAvatarUrl(userId: number): Promise<string | null> {
        const userAvatar = await this.userAvatarRepository.findByUserId(userId);

        return userAvatar?.media.publicUrl ?? null;
    }

    async deleteAllByUserId(userId: number): Promise<void> {
        const userAvatar = await this.userAvatarRepository.findByUserId(userId);

        if (!userAvatar?.media) return;

        await this.mediaService.tryDeleteOne(userAvatar.media);
    }

    async tryDeleteAllByUserId(userId: number): Promise<void> {
        try {
            await this.deleteAllByUserId(userId);
        } catch {
            // User deletion should not be blocked by storage cleanup failure.
        }
    }
}
