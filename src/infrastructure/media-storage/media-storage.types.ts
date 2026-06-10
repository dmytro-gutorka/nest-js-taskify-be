import type { MediaStorageProvider } from '../database/prisma/generated/enums.js';
import type { ValueOf } from '../../common/index.js';
import { MediaStorageResources } from './media-storage.constants.js';

export type MediaStorageResourceType = ValueOf<typeof MediaStorageResources>;

export enum MediaStorageFolderPreset {
    USER_AVATAR = 'user_avatar',
}

export type MediaStorageFolderPresetConfig = {
    preset: MediaStorageFolderPreset.USER_AVATAR;
    userId: number;
};

export interface UploadMediaInput {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    folder?: string;
    folderPreset?: MediaStorageFolderPresetConfig;
    resourceType?: MediaStorageResourceType;
}

export interface UploadMediaResult {
    publicUrl: string;
    storagePublicId: string;
    storageProvider: MediaStorageProvider;
}

export interface MediaStorageService {
    upload(input: UploadMediaInput): Promise<UploadMediaResult>;

    delete(storagePublicId: string): Promise<void>;
}

export const MEDIA_STORAGE_SERVICE = Symbol('MEDIA_STORAGE_SERVICE');
