import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';
import { Task } from '../models/Task.js';
import { Feedback } from '../models/Feedback.js';
import { Profile } from '../models/Profile.js';
import { Interaction } from '../models/Interaction.js';
import { PersonalizationEngine } from '../services/personalizationEngine.js';

export const FeedbackSchema = z.object({
  difficultyFeedback: z.enum(['Too Difficult', 'Just Right', 'Too Easy']),
  helpfulness: z.enum(['Yes', 'Somewhat', 'No']),
  requestedChange: z.enum(['Easier', 'Harder', 'Shorter', 'More examples', 'More explanation']),
  comment: z.string().optional().default(''),
});

export async function startTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;

    const task = await Task.findOne({ _id: id, user: user._id });
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    task.status = 'in_progress';
    await task.save();

    await Interaction.create({
      user: user._id,
      type: 'task_started',
      metadata: { taskId: task._id, title: task.title, duration: task.duration },
    });

    res.status(200).json({
      success: true,
      message: 'Task started',
      task,
    });
  } catch (error: any) {
    console.error('Start task error:', error);
    res.status(500).json({ success: false, error: 'Failed to start task' });
  }
}

export async function completeTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;

    const task = await Task.findOne({ _id: id, user: user._id });
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    task.status = 'completed';
    task.completedAt = new Date();
    await task.save();

    // Update profile metrics
    await Profile.findOneAndUpdate(
      { user: user._id },
      {
        $inc: {
          totalTasksCompleted: 1,
          totalMinutesLearned: task.duration,
        },
      },
      { upsert: true }
    );

    // Record interaction
    await Interaction.create({
      user: user._id,
      type: 'task_completed',
      metadata: { taskId: task._id, title: task.title, duration: task.duration },
    });

    res.status(200).json({
      success: true,
      message: 'Task marked as completed',
      task,
    });
  } catch (error: any) {
    console.error('Complete task error:', error);
    res.status(500).json({ success: false, error: 'Failed to complete task' });
  }
}

export async function skipTask(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;

    const task = await Task.findOne({ _id: id, user: user._id });
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    task.status = 'skipped';
    await task.save();

    await Interaction.create({
      user: user._id,
      type: 'task_skipped',
      metadata: { taskId: task._id, title: task.title, duration: task.duration },
    });

    // Check if long task was skipped: update preference signal
    if (task.duration >= 30) {
      await PersonalizationEngine.upsertPreference(
        user._id,
        'session_length',
        'Session Duration',
        'Shorter sessions (under 25 min)',
        80,
        `Skipped longer task "${task.title}" (${task.duration} min); recommends breaking sessions into bite-sized segments.`
      );
    }

    res.status(200).json({
      success: true,
      message: 'Task skipped',
      task,
    });
  } catch (error: any) {
    console.error('Skip task error:', error);
    res.status(500).json({ success: false, error: 'Failed to skip task' });
  }
}

export async function submitTaskFeedback(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { difficultyFeedback, helpfulness, requestedChange, comment } = req.body;

    const task = await Task.findOne({ _id: id, user: user._id });
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    // 1. Save feedback to MongoDB
    const feedback = await Feedback.create({
      user: user._id,
      task: task._id,
      taskTitle: task.title,
      difficultyFeedback,
      helpfulness,
      requestedChange,
      comment: comment || '',
      timestamp: new Date(),
    });

    // If task was not marked completed yet, mark it completed
    if (task.status !== 'completed') {
      task.status = 'completed';
      task.completedAt = new Date();
      await task.save();

      await Profile.findOneAndUpdate(
        { user: user._id },
        {
          $inc: { totalTasksCompleted: 1, totalMinutesLearned: task.duration },
        }
      );
    }

    // 2. Run Personalization Engine to update preferences & adapt plan
    const { adaptation, updatedPreferences, insight } = await PersonalizationEngine.processFeedback(
      user,
      task,
      feedback
    );

    res.status(200).json({
      success: true,
      message: 'Feedback submitted and plan adapted',
      feedback,
      adaptation,
      updatedPreferences,
      insight,
    });
  } catch (error: any) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ success: false, error: 'Failed to process feedback' });
  }
}
