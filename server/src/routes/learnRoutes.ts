import { Router } from 'express';
import { getLearnedPreferences } from '../controllers/learnController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getLearnedPreferences);

export default router;
