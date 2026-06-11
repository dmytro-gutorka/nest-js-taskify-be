import {
    type UploadMediaInput,
    type MediaStorageFolderPresetConfig,
    type UploadMediaResult,
    MediaStorageFolderPreset,
    MediaStorageService,
} from './media-storage.types.js';
import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {type UploadApiResponse, v2 as cloudinary} from 'cloudinary';
import {MediaStorageProvider} from '../database/prisma/generated/enums.js';
import {MediaStorageResources} from './media-storage.constants.js';

@Injectable()
export class CloudinaryMediaStorageService extends MediaStorageService {
    private readonly defaultFolder: string;

    constructor(private readonly configService: ConfigService) {
        super();
        cloudinary.config({
            cloud_name: this.configService.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
            api_key: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
            api_secret: this.configService.getOrThrow<string>('CLOUDINARY_API_SECRET'),
            secure: true,
        });

        this.defaultFolder = this.configService.get<string>('CLOUDINARY_FOLDER') ?? 'taskify';
    }

    async upload(input: UploadMediaInput): Promise<UploadMediaResult> {
        const uploadResult = await this.uploadBuffer(input);

        return {
            publicUrl: uploadResult.secure_url,
            storagePublicId: uploadResult.public_id,
            storageProvider: MediaStorageProvider.CLOUDINARY,
        };
    }

    async delete(storagePublicId: string): Promise<void> {
        await cloudinary.uploader.destroy(storagePublicId, {
            resource_type: MediaStorageResources.IMAGE,
        });
    }

    private resolveFolder(input: UploadMediaInput): string {
        if (input.folder) return input.folder;

        if (input.folderPreset) return this.resolveFolderPreset(input.folderPreset);

        return this.defaultFolder;
    }

    private resolveFolderPreset(folderPreset: MediaStorageFolderPresetConfig): string {
        switch (folderPreset.preset) {
            case MediaStorageFolderPreset.USER_AVATAR:
                return `${this.defaultFolder}/users/${folderPreset.userId}/avatars`;
            default:
                return this.defaultFolder;
        }
    }

    private async uploadBuffer(input: UploadMediaInput): Promise<UploadApiResponse> {
        const uploadInfo = {
            folder: this.resolveFolder(input),
            resource_type: input.resourceType ?? MediaStorageResources.IMAGE,
            use_filename: true,
            unique_filename: true,
            overwrite: false,
        } as const;

        return new Promise<UploadApiResponse>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(uploadInfo, (error, result) => {
                if (error) {
                    reject(new Error(error.message));
                    return;
                }

                if (!result) {
                    reject(new Error('Cloudinary upload failed'));
                    return;
                }

                resolve(result);
            });

            uploadStream.end(input.buffer);
        });
    }
}
