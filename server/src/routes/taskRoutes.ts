import { Router } from 'express';
import {
  startTask,
  completeTask,
  skipTask,
  submitTaskFeedback,
  FeedbackSchema,
} from '../controllers/taskController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

router.post('/:id/start', startTask);
router.post('/:id/complete', completeTask);
router.post('/:id/skip', skipTask);
router.post('/:id/feedback', validateBody(FeedbackSchema), submitTaskFeedback);

export default router;
