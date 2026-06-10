import type { ActiveUser } from '../modules/auth/auth.types.js';

declare global {
    namespace Express {
        interface Request {
            user?: ActiveUser;
        }
    }
}
