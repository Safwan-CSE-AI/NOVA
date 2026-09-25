import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { isUsingMemoryDB } from '../config/db.js';

export interface AuthRequest extends Request {
  user?: IUser;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Authorization token required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'nova_default_jwt_secret_personalization';

    const decoded = jwt.verify(token, secret) as any;
    let user = await User.findById(decoded.userId);

    // If running in serverless in-memory mode and container cycled, auto-restore the verified user in memory
    if (!user && decoded.userId) {
      if ((global as any).isInMemoryDB || isUsingMemoryDB) {
        console.log(`[Auth] Auto-restoring session for user ${decoded.email || decoded.userId} in serverless memory`);
        user = await User.create({
          _id: decoded.userId,
          name: decoded.name || 'Personalized Learner',
          email: (decoded.email || `user_${decoded.userId}@nova.local`).toLowerCase(),
          passwordHash: 'in_memory_session_hash',
          goal: decoded.goal || 'Master key concepts through personalized learning',
          availableTime: '2 hours',
          energyLevel: decoded.energyLevel || 'Medium',
          preferredStyle: decoded.preferredStyle || 'Practical',
          focusDuration: 25,
          preferredDifficulty: 'Medium',
          isOnboarded: true,
          isDemoUser: Boolean(decoded.isDemoUser),
        });

        // Ensure Profile document exists for user
        const existingProfile = await Profile.findOne({ user: user._id });
        if (!existingProfile) {
          await Profile.create({
            user: user._id,
            learningBio: '',
          });
        }
      }
    }

    if (!user) {
      res.status(401).json({ success: false, error: 'User no longer exists' });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ success: false, error: 'Session expired. Please log in again.' });
      return;
    }
    res.status(401).json({ success: false, error: 'Invalid authentication token' });
  }
}
