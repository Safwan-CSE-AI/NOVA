import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { SeedService } from '../services/seedService.js';
import { AuthRequest } from '../middleware/auth.js';

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

function generateToken(userId: string): string {
  const secret = process.env.JWT_SECRET || 'nova_default_jwt_secret_personalization';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ success: false, error: 'An account with this email already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      isOnboarded: false,
    });

    await Profile.create({
      user: user._id,
      learningBio: '',
    });

    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        goal: user.goal || 'Master key concepts through personalized learning',
        availableTime: user.availableTime || '2 hours',
        energyLevel: user.energyLevel || 'Medium',
        preferredStyle: user.preferredStyle || 'Practical',
        focusDuration: user.focusDuration || 25,
        preferredDifficulty: user.preferredDifficulty || 'Medium',
        isOnboarded: user.isOnboarded || false,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message || 'Server error during registration' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const token = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        goal: user.goal,
        availableTime: user.availableTime,
        energyLevel: user.energyLevel,
        preferredStyle: user.preferredStyle,
        focusDuration: user.focusDuration,
        preferredDifficulty: user.preferredDifficulty,
        isOnboarded: user.isOnboarded,
        isDemoUser: user.isDemoUser,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const profile = await Profile.findOne({ user: req.user._id });

    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        goal: req.user.goal,
        availableTime: req.user.availableTime,
        energyLevel: req.user.energyLevel,
        preferredStyle: req.user.preferredStyle,
        focusDuration: req.user.focusDuration,
        preferredDifficulty: req.user.preferredDifficulty,
        preferences: req.user.preferences,
        strengths: req.user.strengths,
        weaknesses: req.user.weaknesses,
        isOnboarded: req.user.isOnboarded,
        isDemoUser: req.user.isDemoUser,
      },
      profile,
    });
  } catch (error: any) {
    console.error('GetMe error:', error);
    res.status(500).json({ success: false, error: 'Server error fetching user details' });
  }
}

export async function demoLogin(_req: Request, res: Response): Promise<void> {
  try {
    console.log('Activating Demo Mode for Alex...');
    const { user, token } = await SeedService.seedDemoAccount();

    res.status(200).json({
      success: true,
      message: 'Demo mode activated successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        goal: user.goal,
        availableTime: user.availableTime,
        energyLevel: user.energyLevel,
        preferredStyle: user.preferredStyle,
        focusDuration: user.focusDuration,
        preferredDifficulty: user.preferredDifficulty,
        isOnboarded: user.isOnboarded,
        isDemoUser: true,
      },
    });
  } catch (error: any) {
    console.error('Demo login error:', error);
    res.status(500).json({ success: false, error: 'Failed to initialize demo account' });
  }
}
