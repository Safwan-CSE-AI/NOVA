import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.js';
import { GeminiService } from '../services/geminiService.js';
import { LearnedPreference } from '../models/LearnedPreference.js';
import { Feedback } from '../models/Feedback.js';
import { Task } from '../models/Task.js';
import { DailyPlan } from '../models/DailyPlan.js';

export const CoachMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  taskId: z.string().optional(),
});

export const ExplainSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
});

export async function generatePlanAI(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const learned = await LearnedPreference.find({ user: user._id });
    const recentFeedback = await Feedback.find({ user: user._id }).sort({ timestamp: -1 }).limit(5);

    const planData = await GeminiService.generatePlan(user, learned, recentFeedback);

    res.status(200).json({
      success: true,
      data: planData,
    });
  } catch (error: any) {
    console.error('AI generate plan error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate plan via AI' });
  }
}

export async function coachAI(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { message, taskId } = req.body;

    const learned = await LearnedPreference.find({ user: user._id });
    const recentFeedback = await Feedback.find({ user: user._id }).sort({ timestamp: -1 }).limit(3);

    let currentTask = null;
    if (taskId) {
      currentTask = await Task.findOne({ _id: taskId, user: user._id });
    } else {
      // Find active or first pending task
      currentTask = await Task.findOne({
        user: user._id,
        status: { $in: ['in_progress', 'pending'] },
      }).sort({ order: 1 });
    }

    const response: any = await GeminiService.coach(user, message, learned, recentFeedback, currentTask);

    res.status(200).json({
      success: true,
      reply: response.reply || response.message,
      actionType: response.suggestedAction?.type || response.actionType,
      changes: response.suggestedAction?.changes || response.changes,
      suggestedAction: response.suggestedAction,
      message: response.message,
    });
  } catch (error: any) {
    console.error('AI coach error:', error);
    res.status(500).json({ success: false, error: 'Failed to get coaching response' });
  }
}

export async function explainAI(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { taskId } = req.body;

    const task = await Task.findOne({ _id: taskId, user: user._id });
    if (!task) {
      res.status(404).json({ success: false, error: 'Task not found' });
      return;
    }

    const learned = await LearnedPreference.find({ user: user._id });
    const explanation = GeminiService.explain(user, task, learned);

    res.status(200).json({
      success: true,
      explanation,
    });
  } catch (error: any) {
    console.error('AI explain error:', error);
    res.status(500).json({ success: false, error: 'Failed to explain recommendation' });
  }
}

export async function applyCoachAction(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { actionType, changes } = req.body;

    let appliedReason = '';

    if (actionType === 'reduce_workload') {
      user.energyLevel = 'Low';
      await user.save();

      // Find active plan and reduce durations of pending tasks
      const activePlan = await DailyPlan.findOne({ user: user._id, active: true }).populate('tasks');
      if (activePlan && activePlan.tasks) {
        for (const t of activePlan.tasks) {
          if (t.status === 'pending') {
            const oldDur = t.duration;
            t.duration = Math.max(15, t.duration - 10);
            t.whyExplanation.points.push('Reduced by 10 min following Coach recommendation to prevent fatigue');
            await t.save();
          }
        }
        activePlan.adaptationHistory.push({
          reason: 'Coach applied workload reduction: lowered energy to Low and shortened pending sessions.',
          trigger: 'Coach interaction',
          beforeSummary: 'Standard workload',
          afterSummary: 'Reduced duration by 10 min per pending task',
          timestamp: new Date(),
        });
        await activePlan.save();
      }
      appliedReason = 'Reduced energy state to Low and trimmed upcoming sessions to keep you fresh.';
    } else if (actionType === 'shift_difficulty') {
      const activePlan = await DailyPlan.findOne({ user: user._id, active: true }).populate('tasks');
      if (activePlan && activePlan.tasks) {
        for (const t of activePlan.tasks) {
          if (t.status === 'pending') {
            t.difficulty = changes?.difficulty || 'Medium';
            if (changes?.addTemplates) {
              t.title = `Guided Scaffolding: ${t.title}`;
              t.description = `[Scaffolded Template] Includes structured hints and boilerplate. ${t.description}`;
            }
            await t.save();
          }
        }
      }
      appliedReason = `Adjusted pending difficulty to ${changes?.difficulty || 'Medium'} with guided scaffolding.`;
    }

    res.status(200).json({
      success: true,
      message: appliedReason || 'Action applied successfully',
      user,
    });
  } catch (error: any) {
    console.error('Apply coach action error:', error);
    res.status(500).json({ success: false, error: 'Failed to apply coach action' });
  }
}
