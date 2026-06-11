import {
    AVATAR_FORM_DATA_FIELD_NAME,
    AVATAR_MAX_SIZE_BYTES,
    AVATAR_ALLOWED_MIME_TYPES,
} from '../constants/avatar.constants.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';
import { getAllowedMimeTypesMessage } from '../utils/getAllowedMimeTypesMessage.js';

export const AvatarUploadInterceptor = FileInterceptor(AVATAR_FORM_DATA_FIELD_NAME, {
    storage: memoryStorage(),
    limits: {
        fileSize: AVATAR_MAX_SIZE_BYTES,
        files: 1,
    },
    fileFilter: (_req, file, callback) => {
        if (!AVATAR_ALLOWED_MIME_TYPES.includes(file.mimetype as never)) {
            callback(
                new BadRequestException(`Only ${getAllowedMimeTypesMessage()} images are allowed`),
                false,
            );

            return;
        }

        callback(null, true);
    },
});
