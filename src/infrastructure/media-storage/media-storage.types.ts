// @gutnidev у тебя есть @database/enums
import type { MediaStorageProvider } from '../database/prisma/generated/enums.js';
import { MediaStorageResources } from './media-storage.constants.js';
import { ValueOf } from '../../common/types/common.types.js';

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

export abstract class MediaStorageService {
    abstract upload(input: UploadMediaInput): Promise<UploadMediaResult>;

    abstract delete(storagePublicId: string): Promise<void>;
}
