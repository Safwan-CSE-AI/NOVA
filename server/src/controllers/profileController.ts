import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { Task } from '../models/Task.js';
import { Feedback } from '../models/Feedback.js';
import { LearnedPreference } from '../models/LearnedPreference.js';
import { DailyPlan } from '../models/DailyPlan.js';
import { Interaction } from '../models/Interaction.js';
import { SeedService } from '../services/seedService.js';
import { GeminiService } from '../services/geminiService.js';

export const OnboardingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  goal: z.string().min(2, 'Main goal is required'),
  availableTime: z.enum(['30 min', '1 hour', '2 hours', '3 hours', '4+ hours']),
  energyLevel: z.enum(['Low', 'Medium', 'High']),
  preferredStyle: z.enum(['Practical', 'Visual', 'Theoretical', 'Mixed']),
  focusDuration: z.number().refine((val) => [15, 25, 45, 60].includes(val), {
    message: 'Focus duration must be 15, 25, 45, or 60 minutes',
  }),
  preferredDifficulty: z.enum(['Easy', 'Medium', 'Hard']),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  goal: z.string().min(2).optional(),
  availableTime: z.enum(['30 min', '1 hour', '2 hours', '3 hours', '4+ hours']).optional(),
  energyLevel: z.enum(['Low', 'Medium', 'High']).optional(),
  preferredStyle: z.enum(['Practical', 'Visual', 'Theoretical', 'Mixed']).optional(),
  focusDuration: z.number().refine((val) => [15, 25, 45, 60].includes(val)).optional(),
  preferredDifficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  preferences: z.array(z.string()).optional(),
});

export async function submitOnboarding(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const data = req.body;

    user.name = data.name;
    user.goal = data.goal;
    user.availableTime = data.availableTime;
    user.energyLevel = data.energyLevel;
    user.preferredStyle = data.preferredStyle;
    user.focusDuration = data.focusDuration;
    user.preferredDifficulty = data.preferredDifficulty;
    user.isOnboarded = true;
    if (data.strengths) user.strengths = data.strengths;
    if (data.weaknesses) user.weaknesses = data.weaknesses;

    await user.save();

    // Initialize baseline learned preference based on onboarding answers
    await LearnedPreference.findOneAndUpdate(
      { user: user._id, key: 'learning_modality' },
      {
        user: user._id,
        key: 'learning_modality',
        category: 'Working Style',
        value: `${user.preferredStyle} focus`,
        confidence: 75,
        evidenceCount: 1,
        source: 'Initial onboarding declaration',
        lastUpdated: new Date(),
        $setOnInsert: { history: [{ date: new Date(), note: 'Onboarding preference selected', deltaConfidence: 0 }] },
      },
      { upsert: true, new: true }
    );

    await LearnedPreference.findOneAndUpdate(
      { user: user._id, key: 'session_length' },
      {
        user: user._id,
        key: 'session_length',
        category: 'Session Duration',
        value: `${user.focusDuration}-minute focused blocks`,
        confidence: 75,
        evidenceCount: 1,
        source: 'Initial onboarding focus duration setting',
        lastUpdated: new Date(),
        $setOnInsert: { history: [{ date: new Date(), note: 'Onboarding focus setting', deltaConfidence: 0 }] },
      },
      { upsert: true, new: true }
    );

    // Auto-generate initial personalized plan
    const generated = await GeminiService.generatePlan(user);
    const todayDate = new Date().toISOString().split('T')[0];

    // Deactivate previous plans if any
    await DailyPlan.updateMany({ user: user._id, active: true }, { active: false });

    // Create tasks
    const createdTasks = await Promise.all(
      generated.tasks.map((t, idx) =>
        Task.create({
          user: user._id,
          title: t.title,
          description: t.description,
          duration: t.duration,
          difficulty: t.difficulty,
          category: t.category,
          status: 'pending',
          order: idx + 1,
          whyExplanation: t.whyExplanation,
        })
      )
    );

    const totalDuration = createdTasks.reduce((sum, t) => sum + t.duration, 0);

    const plan = await DailyPlan.create({
      user: user._id,
      date: todayDate,
      focusGoal: generated.focusGoal,
      totalDuration,
      energyLevel: user.energyLevel,
      preferredStyle: user.preferredStyle,
      tasks: createdTasks.map((t) => t._id),
      adaptationHistory: [
        {
          reason: `Initial personalized plan generated: calibrated for ${user.energyLevel} energy and ${user.preferredStyle} style.`,
          trigger: 'Onboarding complete',
          beforeSummary: 'None (Initial Plan)',
          afterSummary: `${createdTasks.length} tasks | ${totalDuration} min total`,
          timestamp: new Date(),
        },
      ],
      active: true,
    });

    for (const t of createdTasks) {
      t.planId = plan._id;
      await t.save();
    }

    res.status(200).json({
      success: true,
      message: 'Onboarding completed and personalized plan generated',
      user,
      planId: plan._id,
    });
  } catch (error: any) {
    console.error('Onboarding submission error:', error);
    res.status(500).json({ success: false, error: 'Failed to complete onboarding' });
  }
}

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const profile = await Profile.findOne({ user: user._id });

    res.status(200).json({
      success: true,
      user,
      profile,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to load profile' });
  }
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const data = req.body;

    const previousEnergy = user.energyLevel;
    const previousDuration = user.focusDuration;

    Object.assign(user, data);
    await user.save();

    // Check if energy changed: if so, adapt pending tasks
    if (data.energyLevel && data.energyLevel !== previousEnergy) {
      await Interaction.create({
        user: user._id,
        type: 'energy_updated',
        metadata: { from: previousEnergy, to: data.energyLevel },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
}

export async function resetData(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { confirmText } = req.body;

    if (confirmText !== 'RESET') {
      res.status(400).json({
        success: false,
        error: 'Confirmation required. Please type RESET to proceed.',
      });
      return;
    }

    if (user.isDemoUser) {
      // Re-seed demo account
      await SeedService.seedDemoAccount();
      res.status(200).json({
        success: true,
        message: 'Demo profile reset to initial hackathon baseline.',
      });
      return;
    }

    // Reset user activity
    await Task.deleteMany({ user: user._id });
    await Feedback.deleteMany({ user: user._id });
    await LearnedPreference.deleteMany({ user: user._id });
    await DailyPlan.deleteMany({ user: user._id });
    await Interaction.deleteMany({ user: user._id });

    // Reset profile stats
    await Profile.findOneAndUpdate(
      { user: user._id },
      {
        totalTasksCompleted: 0,
        totalMinutesLearned: 0,
        adaptabilityScore: 85,
        streakDays: 1,
      }
    );

    user.isOnboarded = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'All learning data and tasks have been reset successfully.',
    });
  } catch (error: any) {
    console.error('Reset data error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset user data' });
  }
}
