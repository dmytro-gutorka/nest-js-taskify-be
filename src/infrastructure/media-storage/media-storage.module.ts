import {Module} from '@nestjs/common';
import {CloudinaryMediaStorageService} from './cloudinary-media-storage.service.js';
import {MediaStorageService} from './media-storage.types.js';
import {ConfigModule} from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    providers: [
        CloudinaryMediaStorageService,
        {
            provide: MediaStorageService,
            useExisting: CloudinaryMediaStorageService,
        },
    ],
    exports: [MediaStorageService],
})
export class MediaStorageModule {
}
