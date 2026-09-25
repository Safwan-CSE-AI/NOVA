import { Router } from 'express';
import { getPlan, generatePlan } from '../controllers/planController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getPlan);
router.post('/generate', generatePlan);

export default router;
