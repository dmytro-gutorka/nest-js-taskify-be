import {
    MEDIA_STORAGE_SERVICE,
    type MediaStorageService,
} from '../../../infrastructure/media-storage/media-storage.types.js';
import { Injectable, Inject } from '@nestjs/common';
import { MediaRepository } from '../repositories/media.repository.js';
import type {
    UploadMediaFileInput,
    MediaEntity,
    CreateUploadedMediaInput,
} from '../media.types.js';

@Injectable()
export class MediaService {
    constructor(
        private readonly mediaRepository: MediaRepository,
        @Inject(MEDIA_STORAGE_SERVICE)
        private readonly mediaStorageService: MediaStorageService,
    ) {}

    async upload(input: UploadMediaFileInput): Promise<MediaEntity> {
        const uploadedMedia = await this.mediaStorageService.upload({
            buffer: input.buffer,
            fileName: input.fileName,
            mimeType: input.mimeType,
            folderPreset: input.folderPreset,
            resourceType: input.resourceType,
        });

        const mediaInput: CreateUploadedMediaInput = {
            mediaType: input.mediaType,
            publicUrl: uploadedMedia.publicUrl,
            storageProvider: uploadedMedia.storageProvider,
            storagePublicId: uploadedMedia.storagePublicId,
            mimeType: input.mimeType,
            originalName: input.fileName,
            sizeBytes: input.size,
        };

        try {
            return await this.create(mediaInput);
        } catch (error) {
            try {
                await this.mediaStorageService.delete(uploadedMedia.storagePublicId);
            } catch {
                // Intentionally ignore cleanup errors.
            }

            throw error;
        }
    }

    create(input: CreateUploadedMediaInput): Promise<MediaEntity> {
        return this.mediaRepository.create(input);
    }

    async deleteOne(media: MediaEntity): Promise<void> {
        await this.mediaStorageService.delete(media.storagePublicId);

        await this.mediaRepository.delete([media.id]);
    }

    async tryDeleteOne(media: MediaEntity): Promise<void> {
        try {
            await this.deleteOne(media);
        } catch {
            // Intentionally ignore media cleanup errors.
        }
    }
}
