import { Router } from 'express';
import { register, login, getMe, demoLogin, RegisterSchema, LoginSchema } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.post('/register', validateBody(RegisterSchema), register);
router.post('/login', validateBody(LoginSchema), login);
router.get('/me', requireAuth, getMe);
router.post('/demo', demoLogin);

export default router;
