import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { DailyPlan } from '../models/DailyPlan.js';
import { Task, ITask } from '../models/Task.js';
import { LearnedPreference } from '../models/LearnedPreference.js';
import { Feedback } from '../models/Feedback.js';
import { GeminiService } from '../services/geminiService.js';

export async function getPlan(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;

    // Find active daily plan
    let plan: any = await DailyPlan.findOne({
      user: user._id,
      active: true,
    }).populate({
      path: 'tasks',
      options: { sort: { order: 1 } },
    });

    // If no active plan, auto-generate one
    if (!plan || !plan.tasks || plan.tasks.length === 0) {
      const learned = await LearnedPreference.find({ user: user._id });
      const recentFeedback = await Feedback.find({ user: user._id }).sort({ timestamp: -1 }).limit(3);

      const generated = await GeminiService.generatePlan(user, learned, recentFeedback);
      const todayDate = new Date().toISOString().split('T')[0];

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

      const createdPlan = await DailyPlan.create({
        user: user._id,
        date: todayDate,
        focusGoal: generated.focusGoal,
        totalDuration,
        energyLevel: user.energyLevel,
        preferredStyle: user.preferredStyle,
        tasks: createdTasks.map((t) => t._id),
        adaptationHistory: [
          {
            reason: generated.rationale,
            trigger: 'Auto-generation',
            beforeSummary: 'No previous active plan',
            afterSummary: `${createdTasks.length} tasks | ${totalDuration} min total`,
            timestamp: new Date(),
          },
        ],
        active: true,
      });

      for (const t of createdTasks) {
        t.planId = createdPlan._id;
        await t.save();
      }

      // Re-populate tasks
      plan = await DailyPlan.findById(createdPlan._id).populate({
        path: 'tasks',
        options: { sort: { order: 1 } },
      });
    }

    // Determine current focus and next task
    const tasks: any[] = plan?.tasks || [];
    const pendingTasks = tasks.filter((t: any) => t.status === 'pending');
    const inProgressTasks = tasks.filter((t: any) => t.status === 'in_progress');
    const completedTasks = tasks.filter((t: any) => t.status === 'completed');

    const nextTask = inProgressTasks[0] || pendingTasks[0] || null;

    res.status(200).json({
      success: true,
      plan: {
        id: plan?._id,
        date: plan?.date,
        focusGoal: plan?.focusGoal,
        totalDuration: plan?.totalDuration,
        energyLevel: plan?.energyLevel,
        preferredStyle: plan?.preferredStyle,
        adaptationHistory: plan?.adaptationHistory || [],
      },
      tasks,
      stats: {
        total: tasks.length,
        completed: completedTasks.length,
        pending: pendingTasks.length,
        completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
      },
      nextTask,
    });
  } catch (error: any) {
    console.error('Get plan error:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve daily plan' });
  }
}

export async function generatePlan(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const learned = await LearnedPreference.find({ user: user._id });
    const recentFeedback = await Feedback.find({ user: user._id }).sort({ timestamp: -1 }).limit(3);

    const generated = await GeminiService.generatePlan(user, learned, recentFeedback);
    const todayDate = new Date().toISOString().split('T')[0];

    // Mark old plans as inactive
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
          reason: `Fresh plan generated (${generated.source === 'gemini' ? 'Gemini AI' : 'Deterministic Engine'}): ${generated.rationale}`,
          trigger: 'User requested regeneration',
          beforeSummary: 'Previous plan replaced',
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
      message: 'Fresh personalized plan generated',
      plan,
      tasks: createdTasks,
    });
  } catch (error: any) {
    console.error('Generate plan error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate plan' });
  }
}
