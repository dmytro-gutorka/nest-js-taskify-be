import { AVATAR_ALLOWED_MIME_TYPES } from '../constants/avatar.constants.js';

export function getAllowedMimeTypesMessage(): string {
    return AVATAR_ALLOWED_MIME_TYPES.map((type) => type.split('/')[1]).join(', ');
}
