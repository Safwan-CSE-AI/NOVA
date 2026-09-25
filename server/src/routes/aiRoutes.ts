import { Router } from 'express';
import {
  generatePlanAI,
  coachAI,
  explainAI,
  applyCoachAction,
  CoachMessageSchema,
  ExplainSchema,
} from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

router.post('/generate-plan', generatePlanAI);
router.post('/coach', validateBody(CoachMessageSchema), coachAI);
router.post('/explain', validateBody(ExplainSchema), explainAI);
router.post('/coach/apply', applyCoachAction);

export default router;
