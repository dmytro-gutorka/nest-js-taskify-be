import { Module } from '@nestjs/common';
import { CloudinaryMediaStorageService } from './cloudinary-media-storage.service.js';
import { MEDIA_STORAGE_SERVICE } from './media-storage.types.js';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    providers: [
        CloudinaryMediaStorageService,
        {
            provide: MEDIA_STORAGE_SERVICE,
            useExisting: CloudinaryMediaStorageService,
        },
    ],
    exports: [MEDIA_STORAGE_SERVICE],
})
export class MediaStorageModule {}
