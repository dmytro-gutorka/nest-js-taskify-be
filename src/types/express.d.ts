// @gutnidev нет там такого интерфейса. Он в common.types
import type { ActiveUser } from '../modules/auth/auth.types.js';

declare global {
    namespace Express {
        interface Request {
            user?: ActiveUser;
        }
    }
}
