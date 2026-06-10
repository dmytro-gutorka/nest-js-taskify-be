import { MediaService } from './services/media.service.js';
import { Module } from '@nestjs/common';
import { MediaStorageModule } from '../../infrastructure/media-storage/media-storage.module.js';
import { MediaRepository } from './repositories/media.repository.js';
import { UserAvatarRepository } from './repositories/user-avatar.repository.js';
import { UserAvatarService } from './services/user-avatar.service.js';

@Module({
    imports: [MediaStorageModule],
    providers: [MediaRepository, UserAvatarRepository, MediaService, UserAvatarService],
    exports: [MediaService, UserAvatarService],
})
export class MediaModule {}
