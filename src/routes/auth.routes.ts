import { Router } from 'express';
import { register, login, changePassword, requestPasswordReset } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/change-password', changePassword);
router.post('/request-password-reset', requestPasswordReset);

export default router;