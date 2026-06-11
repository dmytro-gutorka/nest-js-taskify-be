import type { Media, MediaType, UserAvatar, MediaStorageProvider } from '@database/client';
import type {
    MediaStorageResourceType,
    MediaStorageFolderPresetConfig,
} from '../../infrastructure/media-storage/media-storage.types.js';

export type MediaEntity = Media;

export type UserAvatarWithMedia = UserAvatar & {
    media: Media;
};

export interface CreateUploadedMediaInput {
    mediaType: MediaType;
    publicUrl: string;
    storageProvider: MediaStorageProvider;
    storagePublicId: string;
    mimeType: string;
    originalName: string;
    sizeBytes: number;
}

export interface UploadMediaFileInput {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    size: number;
    mediaType: MediaType;
    folderPreset?: MediaStorageFolderPresetConfig;
    resourceType?: MediaStorageResourceType;
}

export interface CreateUserAvatarInput {
    userId: number;
    mediaId: number;
}

export interface UploadUserAvatarInput {
    buffer: Buffer;
    originalName: string;
    mimeType: string;
    size: number;
}
