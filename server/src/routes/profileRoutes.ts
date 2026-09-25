import { Router } from 'express';
import {
  submitOnboarding,
  getProfile,
  updateProfile,
  resetData,
  OnboardingSchema,
  UpdateProfileSchema,
} from '../controllers/profileController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);

router.post('/onboarding', validateBody(OnboardingSchema), submitOnboarding);
router.get('/', getProfile);
router.put('/', validateBody(UpdateProfileSchema), updateProfile);
router.post('/reset', resetData);

export default router;
